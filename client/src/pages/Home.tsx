import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, ShieldAlert, Activity, ArrowRight, History, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Domain Models ---

type PolicyStatus = "Pending" | "Active" | "Suspended" | "Cancelled";

interface PolicyEvent {
  type: "PaymentFailureEvent" | "FraudFlagEvent" | "ActivationEvent";
  timestamp: string;
  [key: string]: any;
}

interface DecisionTrace {
  rule_version: string;
  evaluated_rules: { rule: string; matched: boolean }[];
  inputs_hash: string;
  timestamp: string;
}

interface TransitionResult {
  previous_status: PolicyStatus;
  new_status: PolicyStatus;
  transition_applied: boolean;
  reason_codes: string[];
  decision_trace: DecisionTrace;
}

// --- Logic Engine (Ported to Frontend for Demo) ---

const evaluateTransition = (
  currentStatus: PolicyStatus,
  events: PolicyEvent[]
): TransitionResult => {
  const trace: DecisionTrace = {
    rule_version: "mvp-1.0.0",
    evaluated_rules: [],
    inputs_hash: "sha256:" + Math.random().toString(36).substring(2, 15), // Simulated hash
    timestamp: new Date().toISOString(),
  };

  let newStatus = currentStatus;
  let reasonCodes: string[] = [];
  let transitionApplied = false;

  // R2: Fraud Cancellation (Highest Priority)
  const fraudEvent = events.find((e) => e.type === "FraudFlagEvent" && e.flag === true);
  trace.evaluated_rules.push({ rule: "R2_FraudCancellation", matched: !!fraudEvent });

  if (fraudEvent) {
    newStatus = "Cancelled";
    reasonCodes.push("FRAUD_CONFIRMED");
    transitionApplied = newStatus !== currentStatus;
    return { previous_status: currentStatus, new_status: newStatus, transition_applied: transitionApplied, reason_codes: reasonCodes, decision_trace: trace };
  }

  // R1: Payment Failure Suspension
  const paymentFailures = events.filter((e) => e.type === "PaymentFailureEvent");
  // Sort by date descending to check recency if needed, but for MVP just count
  const failureCount = paymentFailures.length;
  const r1Matched = currentStatus === "Active" && failureCount >= 2;
  trace.evaluated_rules.push({ rule: "R1_PaymentFailureSuspension", matched: r1Matched });

  if (r1Matched) {
    newStatus = "Suspended";
    reasonCodes.push("PAYMENT_FAILED_TWICE");
    transitionApplied = true;
    return { previous_status: currentStatus, new_status: newStatus, transition_applied: transitionApplied, reason_codes: reasonCodes, decision_trace: trace };
  }

  // R3: Activation Timing Constraint
  const activationEvent = events.find((e) => e.type === "ActivationEvent");
  const r3Matched = currentStatus === "Pending" && !activationEvent;
  trace.evaluated_rules.push({ rule: "R3_ActivationTimingConstraint", matched: r3Matched });

  if (r3Matched) {
    // For MVP, if pending and no activation, we just flag it but don't auto-cancel yet unless specified
    // reasonCodes.push("ACTIVATION_WINDOW_VIOLATION"); 
    // Keeping status as Pending for this demo unless explicit rule says otherwise
  } else if (currentStatus === "Pending" && activationEvent) {
      newStatus = "Active";
      reasonCodes.push("POLICY_ACTIVATED");
      transitionApplied = true;
  }

  return {
    previous_status: currentStatus,
    new_status: newStatus,
    transition_applied: transitionApplied,
    reason_codes: reasonCodes.length > 0 ? reasonCodes : ["NO_TRANSITION"],
    decision_trace: trace,
  };
};

// --- Components ---

const StatusBadge = ({ status }: { status: PolicyStatus }) => {
  const colors = {
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Active: "bg-green-100 text-green-800 border-green-200",
    Suspended: "bg-orange-100 text-orange-800 border-orange-200",
    Cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const icons = {
    Pending: <History className="w-3 h-3 mr-1" />,
    Active: <CheckCircle2 className="w-3 h-3 mr-1" />,
    Suspended: <AlertCircle className="w-3 h-3 mr-1" />,
    Cancelled: <ShieldAlert className="w-3 h-3 mr-1" />,
  };

  return (
    <span className={cn("flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", colors[status])}>
      {icons[status]}
      {status.toUpperCase()}
    </span>
  );
};

export default function Home() {
  const [currentStatus, setCurrentStatus] = useState<PolicyStatus>("Active");
  const [events, setEvents] = useState<PolicyEvent[]>([]);
  const [result, setResult] = useState<TransitionResult | null>(null);

  const addEvent = (type: PolicyEvent["type"]) => {
    const newEvent: PolicyEvent = {
      type,
      timestamp: new Date().toISOString(),
      ...(type === "FraudFlagEvent" ? { flag: true } : {}),
      ...(type === "PaymentFailureEvent" ? { amount: 100.00 } : {}),
    };
    setEvents([...events, newEvent]);
  };

  const clearEvents = () => {
    setEvents([]);
    setResult(null);
  };

  const handleEvaluate = () => {
    const res = evaluateTransition(currentStatus, events);
    setResult(res);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      {/* Hero Section */}
      <div className="relative h-64 w-full overflow-hidden border-b bg-[#001f3f] text-white">
        <div className="container relative flex h-full flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-8 w-8 bg-white text-[#001f3f] flex items-center justify-center font-bold">P</div>
             <span className="text-sm font-bold tracking-widest uppercase text-blue-200">InsurTech Solutions</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-3xl text-white">
            Policy Transition <br/> Logic Validator
          </h1>
          <p className="mt-4 max-w-xl text-lg text-blue-100">
            Deterministic state machine evaluation with complete auditability and compliance.
          </p>
        </div>
      </div>

      <main className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-5 space-y-8">
            
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary block"></span>
                  01. Policy State
                </h2>
                <Badge variant="outline" className="font-mono">INPUT</Badge>
              </div>
              
              <Card className="border-2 shadow-none rounded-none">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Status</Label>
                      <Select 
                        value={currentStatus} 
                        onValueChange={(v) => {
                          setCurrentStatus(v as PolicyStatus);
                          setResult(null);
                        }}
                      >
                        <SelectTrigger className="rounded-none border-input bg-background h-12 text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Event Stream</Label>
                        <Button variant="ghost" size="sm" onClick={clearEvents} className="h-6 text-xs text-muted-foreground hover:text-destructive">
                          Clear Stream
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <Button 
                          variant="outline" 
                          className="justify-start rounded-none border-dashed hover:border-solid hover:bg-muted/50"
                          onClick={() => addEvent("PaymentFailureEvent")}
                        >
                          <Activity className="mr-2 h-4 w-4 text-orange-500" />
                          + Add Payment Failure
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start rounded-none border-dashed hover:border-solid hover:bg-muted/50"
                          onClick={() => addEvent("FraudFlagEvent")}
                        >
                          <ShieldAlert className="mr-2 h-4 w-4 text-red-500" />
                          + Add Fraud Flag
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start rounded-none border-dashed hover:border-solid hover:bg-muted/50"
                          onClick={() => addEvent("ActivationEvent")}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                          + Add Activation
                        </Button>
                      </div>

                      {events.length > 0 && (
                        <div className="mt-4 border rounded-none bg-muted/20 p-4 font-mono text-xs space-y-2 max-h-[200px] overflow-y-auto">
                          {events.map((e, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-dashed pb-1 last:border-0 last:pb-0">
                              <span className="font-bold text-primary">{e.type}</span>
                              <span className="text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Button 
              size="lg" 
              className="w-full rounded-none h-14 text-lg font-bold tracking-wide shadow-none hover:translate-y-[-2px] transition-transform"
              onClick={handleEvaluate}
              disabled={events.length === 0 && currentStatus === "Active"} // Just a basic check, logic allows empty events too
            >
              EVALUATE TRANSITION
            </Button>

          </div>

          {/* Right Column: Output & Trace */}
          <div className="lg:col-span-7 space-y-8">
            
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-1 h-6 bg-destructive block"></span>
                  02. Evaluation Result
                </h2>
                <Badge variant="outline" className="font-mono">OUTPUT</Badge>
              </div>

              {result ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Status Transition Card */}
                  <Card className="border-2 shadow-none rounded-none overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                      <div className="p-6 flex flex-col items-center justify-center bg-muted/10">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Previous</span>
                        <StatusBadge status={result.previous_status} />
                      </div>
                      
                      <div className="p-6 flex flex-col items-center justify-center bg-background relative">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                          <ArrowRight className="w-24 h-24" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Action</span>
                        {result.transition_applied ? (
                          <Badge className="rounded-none bg-primary hover:bg-primary">TRANSITION</Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-none">NO CHANGE</Badge>
                        )}
                      </div>

                      <div className="p-6 flex flex-col items-center justify-center bg-muted/10">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">New Status</span>
                        <StatusBadge status={result.new_status} />
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 border-t flex items-center gap-4">
                      <span className="text-sm font-bold">Reason Codes:</span>
                      <div className="flex gap-2">
                        {result.reason_codes.map(code => (
                          <code key={code} className="bg-background px-2 py-1 border text-xs font-mono">{code}</code>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Decision Trace */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Decision Trace
                    </h3>
                    <Card className="bg-slate-950 text-slate-50 border-none rounded-none font-mono text-sm shadow-2xl">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                          <div>
                            <div className="text-slate-400 text-xs">Rule Version</div>
                            <div className="text-green-400">{result.decision_trace.rule_version}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-400 text-xs">Input Hash</div>
                            <div className="text-slate-500 text-[10px] break-all max-w-[150px]">{result.decision_trace.inputs_hash}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-slate-400 text-xs mb-2">Evaluated Rules (Priority Order)</div>
                          {result.decision_trace.evaluated_rules.map((rule, idx) => (
                            <div key={idx} className="flex items-center justify-between group">
                              <span className={cn("transition-colors", rule.matched ? "text-white font-bold" : "text-slate-600")}>
                                {idx + 1}. {rule.rule}
                              </span>
                              {rule.matched ? (
                                <span className="text-green-400 flex items-center gap-1 text-xs">
                                  MATCHED <CheckCircle2 className="w-3 h-3" />
                                </span>
                              ) : (
                                <span className="text-slate-700 text-xs">SKIPPED</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                </div>
              ) : (
                <div className="h-64 border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                  <Activity className="w-12 h-12 mb-4 opacity-20" />
                  <p>Configure state and click Evaluate</p>
                </div>
              )}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
