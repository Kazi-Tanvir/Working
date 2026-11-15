import { spawn, ChildProcess } from "child_process";

async function runBrowserTest() {
  console.log("=== RUNNING CDP BROWSER TESTS FOR MODAL BACK BUTTON ===");

  const BASE_URL = "http://localhost:3000";

  // 1. Create a test user and obtain auth tokens
  const testUser = {
    username: `op_browser_${Date.now().toString().slice(-6)}`,
    email: `op_browser_${Date.now().toString().slice(-6)}@shindb.prod`,
    password: "Password123!",
    displayName: "Browser Test Agent",
  };

  console.log("Registering test operator:", testUser.username);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-allow-registration": "true" },
    body: JSON.stringify(testUser),
  });
  const regData = await regRes.json();
  const token = regData.token;
  if (!token) throw new Error("Failed to register test user: " + JSON.stringify(regData));

  // 2. Track an anime so /anime has at least one real media card
  console.log("Tracking sample anime for user...");
  const trackRes = await fetch(`${BASE_URL}/api/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Attack on Titan",
      type: "anime",
      releaseYear: 2013,
      status: "watching",
      progress: "12/25 EP",
      progressCurrent: 12,
    }),
  });
  console.log("Track response status:", trackRes.status);

  // 3. Launch Edge with remote debugging
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const userDataDir = "C:\\Users\\SENPAI778\\AppData\\Local\\Temp\\edge-cdp-test";

  console.log("Launching Edge with remote debugging on 127.0.0.1:9222...");
  const browserProc: ChildProcess = spawn(
    edgePath,
    [
      "--headless=new",
      "--remote-debugging-port=9222",
      `--user-data-dir=${userDataDir}`,
      "--remote-allow-origins=*",
      "--no-first-run",
      "--no-default-browser-check",
    ],
    { stdio: "ignore" }
  );

  let version: any = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9222/json/version");
      if (res.ok) {
        version = await res.json();
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!version) {
    browserProc.kill();
    throw new Error("Failed to connect to CDP endpoint on 127.0.0.1:9222");
  }

  console.log("Connected to browser:", version.Browser);

  const targetRes = await fetch("http://127.0.0.1:9222/json/new?http://localhost:3000/", { method: "PUT" });
  const target = await targetRes.json();
  console.log("Created target tab:", target.id);

  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map<number, (res: any) => void>();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data as string);
    if (data.method === "Runtime.consoleAPICalled") {
      console.log("[Browser Console]", data.params.type, JSON.stringify(data.params.args?.map((a: any) => a.value)));
    }
    if (data.method === "Runtime.exceptionThrown") {
      console.error("[Browser Exception]", data.params.exceptionDetails?.exception?.description || data.params.exceptionDetails?.text);
    }
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id)!;
      pending.delete(data.id);
      resolve(data);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  function send(method: string, params: any = {}): Promise<any> {
    const id = msgId++;
    return new Promise((resolve) => {
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("DOM.enable");
  await send("Network.enable");

  // Set auth cookies in the browser tab
  await send("Network.setCookie", {
    name: "shindb_access_token",
    value: token,
    domain: "localhost",
    path: "/",
  });

  async function evaluate(expression: string): Promise<any> {
    const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    return res.result?.result?.value;
  }

  async function wait(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  let failed = 0;

  try {
    // -------------------------------------------------------------
    // PART 1: MOBILE VIEWPORT TEST (390x844 - Phone)
    // -------------------------------------------------------------
    console.log("\n▶ [TEST 1] Setting Mobile Emulation (390x844)...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });

    // 1. Start at /
    console.log("1. Navigating to http://localhost:3000/...");
    await send("Page.navigate", { url: "http://localhost:3000/" });
    await wait(2500);
    let path = await evaluate("window.location.pathname");
    console.log("Current path:", path);

    // 2. Navigate to /anime
    console.log("2. Navigating to http://localhost:3000/anime...");
    await send("Page.navigate", { url: "http://localhost:3000/anime" });
    await wait(3000);
    path = await evaluate("window.location.pathname");
    console.log("Current path:", path);
    const bodyText = await evaluate("document.body.innerText.slice(0, 300)");
    console.log("Page preview:", bodyText.replace(/\n+/g, " "));

    // 3. Click anime card to open MediaModal
    console.log("3. Clicking anime media card...");
    await evaluate(`
      (() => {
        const card = document.querySelector('.group.cursor-pointer');
        if (card) card.click();
      })()
    `);
    await wait(2000);

    // 4. Verify modal is open (waiting for dynamic import on dev server if needed)
    console.log("4. Waiting for MediaModal to appear in DOM...");
    let isModalOpen1 = false;
    for (let i = 0; i < 20; i++) {
      isModalOpen1 = await evaluate(`!!document.querySelector('.fixed.inset-0.z-50')`);
      if (isModalOpen1) break;
      await wait(500);
    }
    console.log("Is MediaModal open on screen:", isModalOpen1);
    if (!isModalOpen1) {
      console.error("❌ FAILED: Modal did not open on mobile");
      failed++;
    } else {
      console.log("✔ PASS: Modal opened successfully on mobile");
    }

    // 5. Trigger browser back (First Back: should CLOSE modal and stay at /anime)
    console.log("5. Triggering 1st Back (Gesture / Hardware Back)...");
    await evaluate("window.history.back()");

    let isModalOpenAfterBack1 = true;
    for (let i = 0; i < 15; i++) {
      isModalOpenAfterBack1 = await evaluate(`!!document.querySelector('.fixed.inset-0.z-50')`);
      if (!isModalOpenAfterBack1) break;
      await wait(300);
    }
    const pathAfterBack1 = await evaluate("window.location.pathname");
    console.log("Modal state after 1st back:", isModalOpenAfterBack1 ? "OPEN" : "CLOSED");
    console.log("URL path after 1st back:", pathAfterBack1);

    if (isModalOpenAfterBack1 === false && pathAfterBack1 === "/anime") {
      console.log("✔ PASS: 1st back successfully closed the modal and kept user on /anime!");
    } else {
      console.error("❌ FAILED: Expected modal CLOSED and path '/anime', got modal=" + isModalOpenAfterBack1 + ", path=" + pathAfterBack1);
      failed++;
    }

    // 6. Trigger browser back (Second Back: should now navigate back to /)
    console.log("6. Triggering 2nd Back...");
    await evaluate("window.history.back()");

    let pathAfterBack2 = "/anime";
    for (let i = 0; i < 20; i++) {
      pathAfterBack2 = await evaluate("window.location.pathname");
      if (pathAfterBack2 === "/") break;
      await wait(300);
    }
    console.log("URL path after 2nd back:", pathAfterBack2);
    if (pathAfterBack2 === "/") {
      console.log("✔ PASS: 2nd back navigated back to '/'!");
    } else {
      console.error("❌ FAILED: Expected path '/', got " + pathAfterBack2);
      failed++;
    }

    // -------------------------------------------------------------
    // PART 2: DESKTOP VIEWPORT TEST (1280x800)
    // -------------------------------------------------------------
    console.log("\n▶ [TEST 2] Setting Desktop Emulation (1280x800)...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log("1. Navigating to http://localhost:3000/anime on desktop...");
    await send("Page.navigate", { url: "http://localhost:3000/anime" });
    await wait(3000);

    console.log("2. Clicking anime media card on desktop...");
    await evaluate(`
      (() => {
        const card = document.querySelector('.group.cursor-pointer');
        if (card) card.click();
      })()
    `);
    await wait(1500);

    const isDesktopModalOpen = await evaluate(`
      (() => {
        const modal = document.querySelector('.fixed.inset-0.z-50');
        return !!modal;
      })()
    `);
    console.log("Is MediaModal open on desktop:", isDesktopModalOpen);
    if (!isDesktopModalOpen) {
      console.error("❌ FAILED: Modal did not open on desktop");
      failed++;
    } else {
      console.log("✔ PASS: Modal opened normally on desktop");
    }

    // Close via Close Window button on desktop
    console.log("3. Closing modal via UI on desktop...");
    await evaluate(`
      (() => {
        const closeBtn = document.querySelector('button[title="Close Panel"]') || document.querySelector('.fixed.inset-0.z-50 button');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await wait(1500);

    const isDesktopModalClosed = await evaluate(`
      (() => {
        const modal = document.querySelector('.fixed.inset-0.z-50');
        return !modal;
      })()
    `);
    console.log("Is MediaModal closed on desktop:", isDesktopModalClosed);
    if (isDesktopModalClosed) {
      console.log("✔ PASS: Desktop modal closes cleanly, zero desktop regression");
    } else {
      console.error("❌ FAILED: Desktop modal failed to close");
      failed++;
    }

  } catch (err: any) {
    console.error("❌ UNEXPECTED ERROR:", err);
    failed++;
  } finally {
    try {
      await fetch(`http://127.0.0.1:9222/json/close/${target.id}`, { method: "PUT" });
      ws.close();
    } catch {}
    browserProc.kill();
  }

  console.log(`\n=== BROWSER TEST RESULT: ${failed === 0 ? "ALL TESTS PASSED (100% SUCCESS)" : `${failed} FAILED`} ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runBrowserTest().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
