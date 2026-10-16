import { SignUp } from "@clerk/nextjs";
import { Terminal, Shield } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md mx-auto my-auto flex flex-col gap-6 font-mono py-6">
      {/* Top System Header */}
      <div className="flex items-center justify-between border-b border-white/20 pb-2 text-[11px] text-gray-400 uppercase tracking-widest">
        <span className="flex items-center gap-1.5 text-cyber-green">
          <span className="w-2 h-2 bg-cyber-green rounded-full animate-pulse" />
          SHINDB // REGISTER
        </span>
        <span className="text-gray-400">NEW ACCOUNT</span>
      </div>

      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between bg-black border-2 border-white px-4 py-2.5 shadow-[4px_4px_0px_0px_#ffffff]">
        <div className="flex items-center gap-2">
          <div className="bg-cyber-purple p-1 border border-white">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-xs tracking-widest uppercase text-white">
            [CREATE ACCOUNT]
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-cyber-green font-bold uppercase">
          <Shield className="w-3.5 h-3.5 text-cyber-green" />
          <span>NEW USER</span>
        </div>
      </div>

      {/* Clerk SignUp Component with Theme Customization */}
      <div className="flex justify-center">
        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full bg-[#0d0d0f] border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] rounded-none p-6 md:p-8",
              headerTitle: "font-mono font-black uppercase tracking-widest text-white text-base",
              headerSubtitle: "font-mono text-xs text-gray-400",
              socialButtonsBlockButton:
                "border-2 border-white/40 hover:border-white bg-black hover:bg-white/5 text-white rounded-none shadow-[3px_3px_0px_0px_#ffffff] transition-all font-mono text-xs uppercase tracking-wider font-bold py-2.5",
              socialButtonsBlockButtonText: "font-mono text-xs uppercase tracking-wider font-bold text-white",
              dividerLine: "bg-white/20",
              dividerText: "font-mono text-[10px] uppercase text-gray-400 tracking-wider",
              formFieldLabel: "font-mono text-xs uppercase tracking-wider text-gray-300 font-bold",
              formFieldInput:
                "bg-black border-2 border-white/50 focus:border-cyber-purple focus:ring-0 text-white rounded-none font-mono text-sm py-2 px-3 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all",
              formButtonPrimary:
                "bg-white hover:bg-cyber-purple text-black hover:text-white border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] hover:shadow-[5px_5px_0px_0px_#ffffff] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#ffffff] font-mono font-black uppercase tracking-widest rounded-none py-3 text-xs transition-all",
              footerActionLink: "text-cyber-cyan hover:text-white font-mono text-xs font-bold underline transition-colors",
              footerActionText: "font-mono text-xs text-gray-400",
              identityPreviewText: "font-mono text-xs text-white",
              identityPreviewEditButton: "text-cyber-cyan font-mono text-xs font-bold",
            },
          }}
        />
      </div>

      {/* Cyber System Status Footer */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest px-1">
        <span>STATUS: READY FOR ENLISTMENT</span>
        <span className="text-cyber-green flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-cyber-green rounded-full" />
          SYSTEM: ONLINE
        </span>
      </div>
    </div>
  );
}
