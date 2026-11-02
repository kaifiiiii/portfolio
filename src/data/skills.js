import {
  FaPython,
  FaJava,
  FaJs,
  FaHtml5,
  FaCss3Alt,
  FaReact,
  FaNodeJs,
  FaDatabase,
  FaGitAlt,
  FaGithub,
} from 'react-icons/fa'
import { SiExpress, SiMysql } from 'react-icons/si'
import {
  Terminal,
  Network,
  Cpu,
  Database,
  FileSearch,
  MessageSquare,
  Plug,
  Brain,
  Puzzle,
  Users,
  MessageCircle,
  Search,
} from 'lucide-react'

export const skillsContent = {
  eyebrow: '02 — Skills',
  heading: 'What I work with',
}

export const skillGroups = [
  {
    title: 'Programming',
    items: [
      { name: 'Java', Icon: FaJava },
      { name: 'C', Icon: Terminal },
      { name: 'Python', Icon: FaPython },
      { name: 'JavaScript', Icon: FaJs },
    ],
  },
  {
    title: 'Core CS',
    items: [
      { name: 'Data Structures & Algorithms', Icon: Network },
      { name: 'DBMS', Icon: Database },
      { name: 'Operating Systems', Icon: Cpu },
    ],
  },
  {
    title: 'Frontend',
    items: [
      { name: 'HTML5', Icon: FaHtml5 },
      { name: 'CSS3', Icon: FaCss3Alt },
      { name: 'React', Icon: FaReact },
    ],
  },
  {
    title: 'Backend',
    items: [
      { name: 'Node.js', Icon: FaNodeJs },
      { name: 'Express.js', Icon: SiExpress },
    ],
  },
  {
    title: 'Database',
    items: [
      { name: 'SQL', Icon: FaDatabase },
      { name: 'MySQL', Icon: SiMysql },
    ],
  },
  {
    title: 'Generative AI',
    items: [
      { name: 'LLMs', Icon: Brain },
      { name: 'Retrieval-Augmented Generation (RAG)', Icon: FileSearch },
      { name: 'Prompt Engineering', Icon: MessageSquare },
      { name: 'ChromaDB', Icon: FaDatabase },
      { name: 'API integration', Icon: Plug },
    ],
  },
  {
    title: 'Developer tools',
    items: [
      { name: 'Git', Icon: FaGitAlt },
      { name: 'GitHub', Icon: FaGithub },
    ],
  },
  {
    title: 'Interpersonal skills',
    items: [
      { name: 'Problem Solving', Icon: Puzzle },
      { name: 'Teamwork & Collaboration', Icon: Users },
      { name: 'Communication Skills', Icon: MessageCircle },
      { name: 'Analytical Thinking', Icon: Search },
    ],
  },
]