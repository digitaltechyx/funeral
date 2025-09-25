export type Dependent = {
  id: string;
  name: string;
  relationship: string;
  addedDate: string;
};

export type Payment = {
  id: string;
  date: string;
  funeralId: string;
  deceasedName: string;
  amountDeducted: number;
  remainingBalance: number;
};

export type Claim = {
  id: string;
  memberId: string;
  memberName: string;
  deceasedName: string;
  dateOfDeath: string;
  status: "Pending" | "Approved" | "Paid" | "Rejected";
  submissionDate: string;
  funeralDate: string;
  documents: string[];
};

export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  joinDate: string;
  walletBalance: number;
  dependents: Dependent[];
  paymentHistory: Payment[];
  claims: Claim[];
};

export const members: Member[] = [
  {
    id: "MEM001",
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "201-555-0101",
    status: "Active",
    joinDate: "2023-01-15",
    walletBalance: 150.75,
    dependents: [
      { id: "DEP001", name: "Jane Doe", relationship: "Spouse", addedDate: "2023-01-15" },
      { id: "DEP002", name: "Junior Doe", relationship: "Son", addedDate: "2023-02-20" },
    ],
    paymentHistory: [],
    claims: [],
  },
  {
    id: "MEM002",
    name: "Alice Smith",
    email: "alice.smith@email.com",
    phone: "201-555-0102",
    status: "Active",
    joinDate: "2022-11-30",
    walletBalance: 25.5,
    dependents: [],
    paymentHistory: [],
    claims: [],
  },
  {
    id: "MEM003",
    name: "Bob Johnson",
    email: "bob.johnson@email.com",
    phone: "201-555-0103",
    status: "Inactive",
    joinDate: "2023-03-10",
    walletBalance: 0,
    dependents: [{ id: "DEP003", name: "Brenda Johnson", relationship: "Spouse", addedDate: "2023-03-10" }],
    paymentHistory: [],
    claims: [],
  },
  {
    id: "MEM004",
    name: "Charlie Brown",
    email: "charlie.brown@email.com",
    phone: "201-555-0104",
    status: "Active",
    joinDate: "2023-05-22",
    walletBalance: 300.0,
    dependents: [],
    paymentHistory: [],
    claims: [],
  },
];

export const claims: Claim[] = [
    {
        id: "CLM001",
        memberId: "MEM002",
        memberName: "Alice Smith",
        deceasedName: "Adam Smith",
        dateOfDeath: "2023-10-05",
        status: "Paid",
        submissionDate: "2023-10-06",
        funeralDate: "2023-10-10",
        documents: ["death_certificate_adam_smith.pdf"]
    },
    {
        id: "CLM002",
        memberId: "MEM004",
        memberName: "Charlie Brown",
        deceasedName: "Sally Brown",
        dateOfDeath: "2024-02-15",
        status: "Approved",
        submissionDate: "2024-02-16",
        funeralDate: "2024-02-20",
        documents: ["death_certificate_sally_brown.pdf"]
    },
    {
        id: "CLM003",
        memberId: "MEM001",
        memberName: "John Doe",
        deceasedName: "Janet Doe",
        dateOfDeath: "2024-06-01",
        status: "Pending",
        submissionDate: "2024-06-02",
        funeralDate: "2024-06-06",
        documents: ["death_cert_janet.pdf"]
    },
];

// Let's populate payment history based on the 'Paid' claim
const activeMembersCount = members.filter(m => m.status === 'Active').length;
const shareAmount = 8000 / activeMembersCount;

members.forEach(member => {
    if (member.status === 'Active') {
        member.paymentHistory.push({
            id: `PAY-${member.id}-001`,
            date: "2023-10-07",
            funeralId: "CLM001",
            deceasedName: "Adam Smith",
            amountDeducted: parseFloat(shareAmount.toFixed(2)),
            remainingBalance: member.walletBalance - parseFloat(shareAmount.toFixed(2))
        });
    }
});

export const auditLogsForAI = JSON.stringify({
  description: "A log of all financial transactions within the FuneralShare community system.",
  transactions: [
    ...members.flatMap(m => m.paymentHistory.map(p => ({
      type: 'deduction',
      memberId: m.id,
      memberName: m.name,
      claimId: p.funeralId,
      deceasedName: p.deceasedName,
      amount: p.amountDeducted,
      date: p.date,
      notes: "Contribution for community member's funeral."
    }))),
    ...claims.filter(c => c.status === 'Paid').map(c => ({
      type: 'payout',
      claimantId: c.memberId,
      claimantName: c.memberName,
      claimId: c.id,
      deceasedName: c.deceasedName,
      amount: 8000.00,
      date: new Date(new Date(c.submissionDate).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Simulating payout 2 days after submission
      notes: "Payout for approved funeral claim."
    }))
  ]
}, null, 2);


export const getDashboardData = () => {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'Active').length;
    const totalFunerals = claims.filter(c => c.status === 'Paid').length;
    const eachShareAmount = activeMembers > 0 ? 8000 / activeMembers : 0;
    
    // Assuming we're looking at the first member's data
    const currentUser = members[0];

    // Mock data for new fields - these will be replaced with real data from Firestore
    const walletPool = 8496.00; // This will be managed by Super Admin
    const sadqaWallet = 0.00; // User's sadqa wallet balance

    return {
        totalMembers,
        activeMembers,
        walletBalance: currentUser.walletBalance,
        eachShareAmount: parseFloat(eachShareAmount.toFixed(2)),
        dependentsCount: currentUser.dependents.length,
        totalFunerals,
        maxPayout: 8000,
        walletPool,
        sadqaWallet,
        latestClaim: claims.find(c => c.status === 'Approved' || c.status === 'Paid') || claims[0],
        userStatus: currentUser.status
    }
}
