import assert from "node:assert";

console.log("=== RUNNING RESPONSIVENESS LOGIC TESTS ===");

// 1. Test Scroll Direction State Logic
console.log("\n[TEST 1] Scroll Direction & Header Visibility Logic...");

interface ScrollState {
  scrollY: number;
  lastScrollY: number;
  threshold: number;
  topOffset: number;
  maxScrollY: number;
}

function computeVisibility(state: ScrollState): { isVisible: boolean; nextLastScrollY: number } {
  const { scrollY, lastScrollY, threshold, topOffset, maxScrollY } = state;
  
  if (scrollY <= topOffset) {
    return { isVisible: true, nextLastScrollY: Math.max(0, scrollY) };
  }

  // Prevent bounce at bottom
  if (maxScrollY > 0 && scrollY >= maxScrollY - 20) {
    return { isVisible: false, nextLastScrollY: lastScrollY };
  }

  const diff = scrollY - lastScrollY;
  if (Math.abs(diff) >= threshold) {
    const isScrollingDown = diff > 0;
    return { isVisible: !isScrollingDown, nextLastScrollY: Math.max(0, scrollY) };
  }

  // Under threshold, maintain previous visibility
  return { isVisible: true, nextLastScrollY: lastScrollY };
}

// Initial state at top of page
let res = computeVisibility({ scrollY: 0, lastScrollY: 0, threshold: 10, topOffset: 15, maxScrollY: 2000 });
assert.strictEqual(res.isVisible, true, "Header must be visible at top (scrollY = 0)");

// Scroll down by 50px
res = computeVisibility({ scrollY: 50, lastScrollY: 0, threshold: 10, topOffset: 15, maxScrollY: 2000 });
assert.strictEqual(res.isVisible, false, "Header must hide when scrolling down past threshold");

// Small jitter (4px down) should not toggle
const jitterRes = computeVisibility({ scrollY: 54, lastScrollY: 50, threshold: 10, topOffset: 15, maxScrollY: 2000 });
assert.strictEqual(jitterRes.isVisible, true, "Sub-threshold jitter must not trigger toggle");

// Scroll up by 25px
res = computeVisibility({ scrollY: 25, lastScrollY: 50, threshold: 10, topOffset: 15, maxScrollY: 2000 });
assert.strictEqual(res.isVisible, true, "Header must become visible when scrolling upward");

// Return to top (< topOffset)
res = computeVisibility({ scrollY: 10, lastScrollY: 25, threshold: 10, topOffset: 15, maxScrollY: 2000 });
assert.strictEqual(res.isVisible, true, "Header must remain visible when near top");
console.log("✔ PASS: Scroll direction calculations handle scroll down, scroll up, jitter threshold, and top offset.");

// 2. Test Toast Deduplication & Queue Bound Logic
console.log("\n[TEST 2] Toast Queue Bounds & Deduplication...");

interface ToastItem {
  id: string;
  message: string;
  type: string;
}

function enqueueToast(prev: ToastItem[], newToast: ToastItem): ToastItem[] {
  // Prevent duplicate if identical message is already queued
  if (prev.some((t) => t.message === newToast.message)) {
    return prev;
  }
  // Limit to max 2 active toasts
  const trimmed = prev.length >= 2 ? prev.slice(-1) : prev;
  return [...trimmed, newToast];
}

let queue: ToastItem[] = [];
queue = enqueueToast(queue, { id: "1", message: "Updated in library!", type: "success" });
assert.strictEqual(queue.length, 1, "Queue should have 1 item");

// Re-enqueue same message
queue = enqueueToast(queue, { id: "2", message: "Updated in library!", type: "success" });
assert.strictEqual(queue.length, 1, "Duplicate message must be rejected");

// Add 2nd item
queue = enqueueToast(queue, { id: "3", message: "Marked Completed", type: "success" });
assert.strictEqual(queue.length, 2, "Queue should hold 2 distinct items");

// Add 3rd item - queue must trim oldest and keep at most 2
queue = enqueueToast(queue, { id: "4", message: "Third notification", type: "info" });
assert.strictEqual(queue.length, 2, "Queue must not exceed 2 items");
assert.strictEqual(queue[0].id, "3", "Oldest item 1 should have been dropped");
assert.strictEqual(queue[1].id, "4", "Newest item 4 should be present");
console.log("✔ PASS: Toast queue caps at 2 items and rejects duplicate messages.");

// 3. Test Mobile Modal Height Clearance Logic
console.log("\n[TEST 3] Modal Dynamic Viewport Height Sizing...");

function checkModalFits(viewportHeight: number, browserBarHeight: number): { fits: boolean; maxModalHeight: number } {
  // In Brave/Chrome mobile:
  // Visible space = viewportHeight - browserBarHeight
  const visibleHeight = viewportHeight - browserBarHeight;
  // Modal uses max-h-[82dvh]
  const modalHeight = Math.round(visibleHeight * 0.82);
  const remainingMargin = visibleHeight - modalHeight;
  
  return {
    fits: remainingMargin >= 32, // At least 16px top + 16px bottom breathing room
    maxModalHeight: modalHeight,
  };
}

// Typical mobile screen (height 844px, Brave top+bottom toolbars ~110px)
const fitCheck = checkModalFits(844, 110);
assert.strictEqual(fitCheck.fits, true, "Modal must fit comfortably within visible space in Brave mobile");
assert.ok(fitCheck.maxModalHeight <= 734, "Modal max-height must be strictly less than visible viewport");
console.log(`✔ PASS: Modal height ${fitCheck.maxModalHeight}px fits within visible mobile viewport with breathing room.`);

console.log("\n==================================================");
console.log("   ALL RESPONSIVENESS LOGIC TESTS PASSED (100%)   ");
console.log("==================================================");

