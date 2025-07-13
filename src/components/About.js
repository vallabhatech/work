import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import {
  Flag,
  Star,
  Group,
  TrendingUp,
  CheckCircle,
  Engineering,
  BugReport,
  NewReleases
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import db from '../firebase-config';

const iconMap = {
  kickoff: <Flag className="text-green-500" />,
  alpha: <Star className="text-yellow-500" />,
  beta: <Engineering className="text-blue-500" />,
  release: <NewReleases className="text-gray-500" />,
  blocked: <BugReport className="text-red-500" />,
  inprogress: <Engineering className="text-blue-500" />,
  completed: <CheckCircle className="text-green-500" />
};

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="card"
  >
    <div className="flex items-start space-x-4">
      <div className="p-3 bg-blue-100 rounded-full">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  </motion.div>
);

const About = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      const projectDoc = await getDoc(doc(db, 'project', 'info'));
      if (projectDoc.exists()) {
        setProject(projectDoc.data());
      }
      setLoading(false);
    };
    fetchProject();
  }, []);

  if (loading || !project) {
    return (
      <div className="p-6 ml-16 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const timeline = project.timeline || '';
  const status = project.status || {};

  const milestones = [
    {
      title: 'Project Kickoff',
      date: 'Week 1',
      description: 'Initial sync and scope alignment across teams.',
      status: 'completed',
      icon: iconMap.kickoff
    },
    {
      title: `Sprint Status: ${status.sprint}`,
      date: 'Week 2',
      description: `Current milestone: ${status.next_milestone || 'N/A'}`,
      status: 'inprogress',
      icon: iconMap.inprogress
    },
    {
      title: 'Current Blockers',
      date: 'Ongoing',
      description: status.blockers || 'No blockers at the moment.',
      status: 'blocked',
      icon: iconMap.blocked
    },
    {
      title: 'Alpha Release Prep',
      date: 'Week 3',
      description: 'Integrate all core AI behavior and demo to stakeholders.',
      status: 'pending',
      icon: iconMap.alpha
    },
    {
      title: 'Version 1.0 Launch',
      date: 'Week 4',
      description: 'Final release after testing and bug fixes.',
      status: 'pending',
      icon: iconMap.release
    }
  ];

  const features = (project.goals || []).map((goal, i) => ({
    icon: <CheckCircle className="text-purple-500" />,
    title: `Goal ${i + 1}`,
    description: goal
  }));

  return (
    <div className="p-6 ml-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{project.name || 'About the Project'}</h1>
          <p className="text-gray-600 max-w-3xl">{project.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-6">Project Timeline</h2>
          <Timeline position="alternate">
            {milestones.map((milestone, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot
                    sx={{
                      bgcolor:
                        milestone.status === 'completed' ? '#22c55e' :
                          milestone.status === 'inprogress' ? '#3b82f6' :
                            milestone.status === 'blocked' ? '#ef4444' :
                              '#d1d5db'
                    }}
                  >
                    {milestone.icon}
                  </TimelineDot>
                  {index < milestones.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <div className={`p-4 rounded-lg ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <h3 className="text-lg font-semibold">{milestone.title}</h3>
                    <p className="text-gray-500 text-sm">{milestone.date}</p>
                    <p className="text-gray-600 mt-1">{milestone.description}</p>
                  </div>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </motion.div>

        <motion.div
          className="mt-12 p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-2">👋 Hey, I'm Manoj</h2>
          <p className="mb-4 text-white text-opacity-90">
            I love building apps and websites that solve real problems. Whether it's crafting
            tools for startups or experimenting with new tech, I'm always down to collaborate,
            share ideas, or just geek out about code.
          </p>
          <p className="mb-6 text-white text-opacity-90">
            If you're working on something cool or want to jam on ideas, feel free to reach out —
            always looking for exciting new opportunities!
          </p>

          <div className="flex items-center space-x-4">
            <a
              href="https://www.linkedin.com/in/vallabhatech/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-90 transition"
            >
              <img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"
                alt="LinkedIn"
                className="w-8 h-8"
              />
            </a>
            <a
              href="https://github.com/vallabhatech/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-90 transition"
            >
              <img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                alt="GitHub"
                className="w-8 h-8"
              />
            </a>
            <a
              href="https://tinyurl.com/vpnhv/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-90 transition"
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 11c0-2.21 1.343-4 3-4s3 1.79 3 4-1.343 4-3 4-3-1.79-3-4zm-2 0c0 2.21-1.343 4-3 4s-3-1.79-3-4 1.343-4 3-4 3 1.79 3 4zm7.5 4H20m-4 0H8m-4 0h.5"
                />
              </svg>
            </a>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default About;
