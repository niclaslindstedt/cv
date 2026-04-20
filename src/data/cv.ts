export type FocusArea = {
  area: string;
  since: string;
};

export type Project = {
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  repo: string;
};

export type Experience = {
  role: string;
  company: string;
  companyDescription: string;
  startDate: string;
  endDate: string | null;
  engagement?: string;
};

export type Education = {
  field: string;
  institution: string;
  level: string;
  credits: string;
  startDate: string;
  endDate: string;
};

export type Skills = {
  languages: string[];
  frameworks: string[];
  cloud: string[];
  databases: string[];
  ai: string[];
  devops: string[];
};

export type CV = {
  name: string;
  title: string;
  location: string;
  links: { linkedin: string; github: string };
  summary: string;
  focus: FocusArea[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  skills: Skills;
};

export const cv: CV = {
  name: "Niclas Lindstedt",
  title: "IT Architect",
  location: "Sweden",
  links: {
    linkedin: "https://www.linkedin.com/in/niclaslindstedt",
    github: "https://www.github.com/niclaslindstedt",
  },
  summary:
    "IT architect, deep into agentic coding. I build open-source tools that make AI coding agents easier to orchestrate, sandbox, test, and connect to the rest of the world.",
  focus: [
    { area: "LLM development", since: "2023-01" },
    { area: "Agentic coding", since: "2025-05" },
    { area: "Spec-driven agentic coding", since: "2025-07" },
    { area: "Agentic orchestration", since: "2025-10" },
    { area: "Agentic CLI tooling", since: "2025-11" },
  ],
  projects: [
    {
      name: "zag",
      tagline: "One CLI for all your AI coding agents.",
      description:
        "Wraps Claude, Codex, Gemini, Copilot, and Ollama behind a single command so you can switch between them without learning five different CLIs. Adds cross-provider features on top: model size aliases, automatic provider/model selection, git worktree isolation, Docker sandboxing, structured JSON output with schema validation, and unified session logs. Ships as a CLI, a Rust library crate, and SDKs for TypeScript, Python, C#, Swift, Java, and Kotlin.",
      stack: ["Rust"],
      repo: "https://github.com/niclaslindstedt/zag",
    },
    {
      name: "zig",
      tagline: "Describe workflows. Share them. Run them.",
      description:
        "Orchestration CLI for AI coding agents. Describe a workflow in natural language, capture it as a shareable .zwf file, and replay it anywhere with a single command. Embeds zag for the underlying orchestration primitives. Ships with an HTTP API and an embedded React chat UI for designing workflows interactively.",
      stack: ["Rust"],
      repo: "https://github.com/niclaslindstedt/zig",
    },
    {
      name: "zad",
      tagline: "Agent adapter system.",
      description:
        "Connects AI agents to external services (Discord, GitHub, Slack, and more) through scoped service configurations instead of MCP servers. Fine-grained permission files go beyond what upstream APIs offer, with Ed25519-signed policies stored in the OS keychain so an agent with filesystem access can't silently widen its own scope. New providers are a single Rust trait implementation.",
      stack: ["Rust"],
      repo: "https://github.com/niclaslindstedt/zad",
    },
    {
      name: "ztf",
      tagline: "Complex E2E testing using zag verification.",
      description:
        "Agent-assisted end-to-end testing with TOML scenario files. Uses an explicit arrange/act/assert structure with programmatic checks, then optionally delegates nuanced verdicts to an AI reviewer for the cases regex assertions can't cleanly handle. Machine-readable output makes it easy to plug into other tools.",
      stack: ["Rust"],
      repo: "https://github.com/niclaslindstedt/ztf",
    },
  ],
  experience: [
    {
      role: "IT Architect",
      company: "BookBeat AB",
      companyDescription: "Audiobook streaming service with over 1 million users.",
      startDate: "2024-04",
      endDate: null,
    },
    {
      role: "CTO",
      company: "IBNQ AB",
      companyDescription: "Digitalizing family offices.",
      startDate: "2023-09",
      endDate: "2024-04",
    },
    {
      role: "Senior Manager",
      company: "Etimo AB",
      companyDescription:
        "IT consultancy specialized in .NET and JavaScript web applications.",
      startDate: "2020-01",
      endDate: "2023-09",
    },
    {
      role: "CTO & Co-Founder",
      company: "Symptoms Europe AB",
      companyDescription: "eHealth startup focused on patient-doctor communication.",
      startDate: "2015-11",
      endDate: "2020-01",
      engagement: "half-time",
    },
    {
      role: "Senior Software Engineer",
      company: "Indicio Technologies AB",
      companyDescription: "FinTech startup building a forecasting platform.",
      startDate: "2015-09",
      endDate: "2020-01",
      engagement: "half-time",
    },
    {
      role: "Founder",
      company: "Agilator AB",
      companyDescription: "Solo consulting firm for startup engagements.",
      startDate: "2016-02",
      endDate: null,
      engagement: "part-time",
    },
  ],
  education: [
    {
      field: "Information Systems",
      institution: "Uppsala University",
      level: "Bachelor's program",
      credits: "135 ECTS",
      startDate: "2014-08",
      endDate: "2017-06",
    },
    {
      field: "Medicine",
      institution: "Uppsala University",
      level: "Master's program",
      credits: "202 ECTS",
      startDate: "2010-01",
      endDate: "2014-04",
    },
  ],
  skills: {
    languages: ["Rust", "C#", "TypeScript", "Python", "JavaScript", "C++"],
    frameworks: [".NET", "React", "React Native", "Vue"],
    cloud: ["Azure", "AWS"],
    databases: [
      "PostgreSQL",
      "Microsoft SQL Server",
      "MongoDB",
      "Redis",
      "CosmosDB",
    ],
    ai: [
      "Spec-driven development",
      "Multi-agent orchestration",
      "Multi-provider LLM integration",
      "Agent sandboxing & isolation",
      "Agent permissions & security",
      "Agent-in-the-loop testing",
      "RAG",
      "Prompt engineering",
      "AI evaluations",
      "Claude Code",
      "Codex CLI",
      "Gemini CLI",
      "GitHub Copilot",
      "Ollama",
    ],
    devops: ["Docker", "Kubernetes", "CI/CD", "Infrastructure as Code"],
  },
};
