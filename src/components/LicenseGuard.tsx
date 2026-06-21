"use client";

import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function LicenseGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasLicense, setHasLicense] = useState(false);
  const [licenseInput, setLicenseInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [machineId, setMachineId] = useState("");

  useEffect(() => {
    // Check license on mount
    fetch('/api/license')
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setHasLicense(true);
        } else if (data.machineId) {
          setMachineId(data.machineId);
        }
      })
      .catch(err => console.error("Error checking license", err))
      .finally(() => setLoading(false));
  }, []);

  const handleActivate = async () => {
    if (!licenseInput.trim()) {
      toast.error("Please enter a license key");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: licenseInput.trim().toUpperCase() })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("License activated successfully!");
        setHasLicense(true);
      } else {
        toast.error(data.error || "Invalid license key");
      }
    } catch (err) {
      toast.error("Failed to activate license");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasLicense) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-muted/30">
        <div className="mx-auto w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
              <KeyRound className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Activation Required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please enter your license key to continue using Adarsh Shoes Billing Software.
            </p>
            {machineId && (
              <div className="mt-4 rounded-md bg-muted p-4 text-center w-full border border-border">
                <span className="text-xs text-muted-foreground block mb-2 uppercase font-semibold">Your Hardware ID</span>
                <div className="flex items-center justify-between bg-background rounded-md px-3 py-2 border">
                  <span className="font-mono text-sm font-semibold text-primary">{machineId}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 ml-2" 
                    onClick={() => {
                      navigator.clipboard.writeText(machineId);
                      toast.success("Hardware ID copied to clipboard");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  Please copy this Hardware ID and send it to the developer to receive your Activation Key.
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="licenseKey" className="text-sm font-medium">
                Activation Key
              </label>
              <Input
                id="licenseKey"
                placeholder="Enter your activation key..."
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleActivate();
                }}
                className="font-mono uppercase text-center tracking-widest"
                autoComplete="off"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleActivate}
              disabled={submitting || !licenseInput}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Activating...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" /> 
                  Activate Software
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-6 text-center text-xs text-muted-foreground">
            Adarsh Shoes Billing Software &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
