import { FaJava, FaPython, FaJs, FaReact, FaNodeJs, FaDatabase, FaGitAlt, FaHtml5, FaCss3Alt, FaGithub } from 'react-icons/fa'
import { SiTailwindcss, SiMysql, SiExpress } from 'react-icons/si'
import { VscVscode } from 'react-icons/vsc'
import { ChipAI, CloudNodes } from '../components/SkillIcons'
import {
  CodeXml,
  Server,
  Cpu,
  Database,
  Wrench,
  Sparkles,
  FileSearch,
  Brain,
  BrainCircuit,
  CloudCog,
  HardDrive,
  AppWindow,
  Terminal,
  Network,
  GraduationCap,
  Users,
  Puzzle,
  MessageCircle,
  Search,
  MessageSquare,
  Plug,
} from 'lucide-react'

// ---------------------------------------------------------------
// Orbit: one badge per technology. Order follows the reference
// image, clockwise from the top. Edit this list to change the orbit.
// ---------------------------------------------------------------
export const orbitSkills = [
  { name: 'Java', Icon: FaJava, color: '#F89820' },
  { name: 'Python', Icon: FaPython, color: '#4B8BBE' },
  { name: 'JavaScript', Icon: FaJs, color: '#F7DF1E' },
  { name: 'React', Icon: FaReact, color: '#61DAFB' },
  { name: 'Tailwind CSS', Icon: SiTailwindcss, color: '#38BDF8' },
  { name: 'Node.js', Icon: FaNodeJs, color: '#5FA04E' },
  { name: 'MySQL', Icon: SiMysql, color: '#3FA9D6' },
  { name: 'SQL', Icon: FaDatabase, color: '#60A5FA' },
  { name: 'Generative AI', Icon: ChipAI, color: '#A78BFA' },
  { name: 'RAG', Icon: CloudNodes, color: '#8B5CF6' },
  { name: 'Git', Icon: FaGitAlt, color: '#F05033' },
]

// ---------------------------------------------------------------
// Carousel: one entry per card, in display order.
// Only skills you listed are shown, with no levels or percentages.
// ---------------------------------------------------------------
export const skillCategories = [
  {
    id: 'frontend',
    title: 'Frontend',
    Icon: AppWindow,
    description: 'Building responsive and interactive user interfaces.',
    items: [
      { name: 'HTML5', Icon: FaHtml5, color: '#E34F26' },
      { name: 'CSS3', Icon: FaCss3Alt, color: '#1572B6' },
      { name: 'JavaScript', Icon: FaJs, color: '#F7DF1E' },
      { name: 'React', Icon: FaReact, color: '#61DAFB' },
      { name: 'Tailwind CSS', Icon: SiTailwindcss, color: '#38BDF8' },
    ],
  },
  {
    id: 'backend',
    title: 'Backend',
    Icon: Server,
    description: 'Building server-side applications and APIs.',
    items: [
      { name: 'Node.js', Icon: FaNodeJs, color: '#5FA04E' },
      { name: 'Express.js', Icon: SiExpress, color: '#E8EEFB' },
      { name: 'REST APIs', Icon: CloudCog, color: '#38BDF8' },
      { name: 'API integration', Icon: Plug, color: '#60A5FA' },
    ],
  },
  {
    id: 'ai',
    title: 'AI & Machine Learning',
    Icon: Cpu,
    description: 'Building intelligent applications using modern AI technologies.',
    items: [
      { name: 'Generative AI', Icon: Sparkles, color: '#A78BFA' },
      { name: 'Retrieval-Augmented Generation (RAG)', Icon: FileSearch, color: '#8B5CF6' },
      { name: 'LLM Integration', Icon: Brain, color: '#38BDF8' },
      { name: 'Machine Learning', Icon: BrainCircuit, color: '#60A5FA' },
      { name: 'Prompt Engineering', Icon: MessageSquare, color: '#C4B5FD' },
    ],
  },
  {
    id: 'languages',
    title: 'Programming Languages',
    Icon: CodeXml,
    description: 'Languages for application development and problem-solving.',
    items: [
      { name: 'Java', Icon: FaJava, color: '#F89820' },
      { name: 'Python', Icon: FaPython, color: '#4B8BBE' },
      { name: 'JavaScript', Icon: FaJs, color: '#F7DF1E' },
    ],
  },
  {
    id: 'cs',
    title: 'Core CS',
    Icon: GraduationCap,
    description: 'The computer science fundamentals behind dependable software.',
    items: [
      { name: 'C', Icon: Terminal, color: '#A8B9CC' },
      { name: 'Data Structures & Algorithms', Icon: Network, color: '#38BDF8' },
      { name: 'DBMS', Icon: Database, color: '#8B9BFF' },
      { name: 'Operating Systems', Icon: Cpu, color: '#60A5FA' },
    ],
  },
  {
    id: 'databases',
    title: 'Databases',
    Icon: Database,
    description: 'Storing, querying, and managing structured data.',
    items: [
      { name: 'MySQL', Icon: SiMysql, color: '#3FA9D6' },
      { name: 'SQL', Icon: FaDatabase, color: '#60A5FA' },
      { name: 'Database Management', Icon: HardDrive, color: '#8B9BFF' },
      { name: 'ChromaDB', Icon: FaDatabase, color: '#F5B544' },
    ],
  },
  {
    id: 'tools',
    title: 'Developer Tools',
    Icon: Wrench,
    description: 'Tools used to build, manage, and maintain software projects.',
    items: [
      { name: 'Git', Icon: FaGitAlt, color: '#F05033' },
      { name: 'GitHub', Icon: FaGithub, color: '#E8EEFB' },
      { name: 'VS Code', Icon: VscVscode, color: '#3B9CFF' },
    ],
  },
  {
    id: 'interpersonal',
    title: 'Interpersonal Skills',
    Icon: Users,
    description: 'Working well with people and approaching problems with a clear head.',
    items: [
      { name: 'Problem Solving', Icon: Puzzle, color: '#A78BFA' },
      { name: 'Teamwork & Collaboration', Icon: Users, color: '#38BDF8' },
      { name: 'Communication Skills', Icon: MessageCircle, color: '#60A5FA' },
      { name: 'Analytical Thinking', Icon: Search, color: '#8B9BFF' },
    ],
  },
]
