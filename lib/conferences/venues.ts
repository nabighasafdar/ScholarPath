export type VenueTier = "top" | "solid" | "accessible";
export type StudentLevel = "undergrad" | "masters" | "phd" | "any";

export type ConferenceVenue = {
  id: string;
  name: string;
  shortName: string;
  field: string;
  topics: string[];
  tier: VenueTier;
  acceptanceRate: number;
  /** ISO date YYYY-MM-DD for the next typical deadline (illustrative MVP dates). */
  deadline: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  studentLevel: StudentLevel;
  pageLimit: string;
  citationStyle: string;
  url: string;
  /** Text used for embedding / topic fit. */
  topicDescription: string;
  requirements: string[];
};

export const VENUES: ConferenceVenue[] = [
  {
    id: "neurips",
    name: "NeurIPS",
    shortName: "NeurIPS",
    field: "Machine Learning",
    topics: ["deep learning", "representation learning", "generative models", "RL"],
    tier: "top",
    acceptanceRate: 26,
    deadline: "2026-05-15",
    difficulty: 5,
    studentLevel: "phd",
    pageLimit: "9 pages + appendix",
    citationStyle: "NeurIPS",
    url: "https://neurips.cc",
    topicDescription:
      "Neural information processing, deep learning, foundation models, generative AI, reinforcement learning, theory of machine learning.",
    requirements: [
      "Anonymous submission",
      "Page limit enforced",
      "Clear contribution statement",
      "Reproducibility checklist",
    ],
  },
  {
    id: "icml",
    name: "International Conference on Machine Learning",
    shortName: "ICML",
    field: "Machine Learning",
    topics: ["supervised learning", "optimization", "probabilistic models"],
    tier: "top",
    acceptanceRate: 28,
    deadline: "2026-01-30",
    difficulty: 5,
    studentLevel: "phd",
    pageLimit: "8 pages + appendix",
    citationStyle: "ICML",
    url: "https://icml.cc",
    topicDescription:
      "Core machine learning methods, optimization, statistical learning, deep learning applications and theory.",
    requirements: [
      "Anonymous submission",
      "Strict page limit",
      "Broader impact statement optional depending on year",
    ],
  },
  {
    id: "iccv",
    name: "International Conference on Computer Vision",
    shortName: "ICCV",
    field: "Computer Vision",
    topics: ["vision transformers", "detection", "segmentation", "multimodal"],
    tier: "top",
    acceptanceRate: 25,
    deadline: "2026-03-07",
    difficulty: 5,
    studentLevel: "phd",
    pageLimit: "8 pages",
    citationStyle: "IEEE",
    url: "https://iccv.thecvf.com",
    topicDescription:
      "Computer vision, image understanding, video analysis, multimodal vision-language models, 3D vision.",
    requirements: ["Anonymous submission", "IEEE format", "Clear experimental baselines"],
  },
  {
    id: "icse",
    name: "International Conference on Software Engineering",
    shortName: "ICSE",
    field: "Software Engineering",
    topics: ["testing", "program analysis", "SE4AI", "developer tools"],
    tier: "top",
    acceptanceRate: 23,
    deadline: "2026-08-01",
    difficulty: 5,
    studentLevel: "phd",
    pageLimit: "10–12 pages",
    citationStyle: "ACM",
    url: "https://conf.researchr.org/home/icse",
    topicDescription:
      "Software engineering research: testing, program analysis, mining software repositories, AI for SE, empirical SE.",
    requirements: ["ACM format", "Artifact evaluation encouraged", "Threats to validity section"],
  },
  {
    id: "acl",
    name: "ACL",
    shortName: "ACL",
    field: "NLP",
    topics: ["LLMs", "information extraction", "machine translation"],
    tier: "top",
    acceptanceRate: 24,
    deadline: "2026-02-15",
    difficulty: 5,
    studentLevel: "phd",
    pageLimit: "8 pages",
    citationStyle: "ACL",
    url: "https://aclweb.org",
    topicDescription:
      "Natural language processing, large language models, computational linguistics, dialogue systems, information retrieval for text.",
    requirements: ["ACL format", "Limitations section", "Ethics statement"],
  },
  {
    id: "chi",
    name: "CHI Conference on Human Factors in Computing Systems",
    shortName: "CHI",
    field: "HCI",
    topics: ["user studies", "interaction design", "accessibility"],
    tier: "top",
    acceptanceRate: 26,
    deadline: "2026-09-12",
    difficulty: 5,
    studentLevel: "any",
    pageLimit: "~10–12 pages",
    citationStyle: "ACM",
    url: "https://chi.acm.org",
    topicDescription:
      "Human-computer interaction, user experience research, interactive systems, accessibility, social computing.",
    requirements: ["ACM format", "Strong empirical or design contribution", "Ethics approval when needed"],
  },
  {
    id: "aaai",
    name: "AAAI Conference on Artificial Intelligence",
    shortName: "AAAI",
    field: "Artificial Intelligence",
    topics: ["AI systems", "knowledge representation", "ML applications"],
    tier: "solid",
    acceptanceRate: 23,
    deadline: "2026-08-15",
    difficulty: 4,
    studentLevel: "masters",
    pageLimit: "7 pages + refs",
    citationStyle: "AAAI",
    url: "https://aaai.org",
    topicDescription:
      "Broad artificial intelligence: machine learning applications, planning, knowledge graphs, AI systems, agents.",
    requirements: ["AAAI format", "Anonymous submission", "Clear problem statement"],
  },
  {
    id: "emnlp",
    name: "EMNLP",
    shortName: "EMNLP",
    field: "NLP",
    topics: ["LLM evaluation", "information extraction", "summarization"],
    tier: "solid",
    acceptanceRate: 23,
    deadline: "2026-06-01",
    difficulty: 4,
    studentLevel: "masters",
    pageLimit: "8 pages",
    citationStyle: "ACL",
    url: "https://2026.emnlp.org",
    topicDescription:
      "Empirical methods in NLP, language model evaluation, text generation, information extraction, multilingual NLP.",
    requirements: ["ACL format", "Reproducibility details", "Limitations section"],
  },
  {
    id: "ieee-access",
    name: "IEEE Access",
    shortName: "IEEE Access",
    field: "Multidisciplinary Engineering",
    topics: ["applied ML", "IoT", "systems", "signal processing"],
    tier: "accessible",
    acceptanceRate: 30,
    deadline: "2026-12-31",
    difficulty: 2,
    studentLevel: "undergrad",
    pageLimit: "typically 10–12 pages",
    citationStyle: "IEEE",
    url: "https://ieeeaccess.ieee.org",
    topicDescription:
      "Open-access multidisciplinary engineering journal suitable for applied machine learning, IoT, networking, and systems papers.",
    requirements: [
      "IEEE format",
      "Binary PDF upload",
      "Clear contribution and related work",
      "Rolling submissions",
    ],
  },
  {
    id: "compsac",
    name: "IEEE COMPSAC",
    shortName: "COMPSAC",
    field: "Software / Computing",
    topics: ["software systems", "security", "data-driven apps"],
    tier: "accessible",
    acceptanceRate: 30,
    deadline: "2026-04-15",
    difficulty: 3,
    studentLevel: "undergrad",
    pageLimit: "6–8 pages",
    citationStyle: "IEEE",
    url: "https://ieeecompsac.computer.org",
    topicDescription:
      "Computer software and applications: software engineering, security, data-driven systems, applied computing for students and practitioners.",
    requirements: ["IEEE format", "Conference length paper", "Clear evaluation"],
  },
  {
    id: "sai-computing",
    name: "SAI Computing Conference",
    shortName: "SAI Computing",
    field: "Computing",
    topics: ["applied AI", "student projects", "systems demos"],
    tier: "accessible",
    acceptanceRate: 35,
    deadline: "2026-03-01",
    difficulty: 2,
    studentLevel: "undergrad",
    pageLimit: "6 pages",
    citationStyle: "IEEE/Springer (varies)",
    url: "https://saiconference.com/Computing",
    topicDescription:
      "Accessible computing conference for applied AI, student research projects, systems demos, and interdisciplinary computing work.",
    requirements: ["Camera-ready length limit", "English quality check", "Presentation required"],
  },
  {
    id: "esorics",
    name: "ESORICS",
    shortName: "ESORICS",
    field: "Security",
    topics: ["systems security", "privacy", "cryptography applications"],
    tier: "solid",
    acceptanceRate: 20,
    deadline: "2026-04-22",
    difficulty: 4,
    studentLevel: "masters",
    pageLimit: "20 LNCS pages",
    citationStyle: "LNCS/Springer",
    url: "https://www.esorics.org",
    topicDescription:
      "European symposium on research in computer security: systems security, privacy, applied cryptography, secure ML.",
    requirements: ["LNCS format", "Strong threat model", "Reproducible evaluation"],
  },
];

export function getVenueById(id: string): ConferenceVenue | undefined {
  return VENUES.find((v) => v.id === id);
}
