type STRATEGIES = "AFFIRMATIVE" | "CONSENSUS" | "UNANIMOUS";
enum ACCESS {
  GRANTED = 1,
  ABSTAIN = 0,
  DENIED = -1
}
type GrantCallback = (err: null | Error, access: ACCESS) => void;

interface SimpleVoter {
  (attr: any, subj: any, user: any): ACCESS
}

interface PromiseVoter {
  (attr: any, subj: any, user: any): Promise<ACCESS>
}

type Voter = SimpleVoter | PromiseVoter

export function addVoter(voter: Voter): number;
export function isGranted(attr: any, subj: any, user: any, strategy: STRATEGIES): Promise<ACCESS>;
export function isGranted(attr: any, subj: any, user: any, strategy: STRATEGIES, cb: GrantCallback): void;
