import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveBar } from '@nivo/bar';
import { 
  Star,
  AccessTime,
  CheckCircle,
  Warning,
  Block
} from '@mui/icons-material';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import db from '../firebase-config';

const getAvatarUrl = (name) =>
  `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}&size=64`;

const MemberCard = ({ member }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="card"
  >
    <div className="flex items-start space-x-4">
    <img
  src={getAvatarUrl(member.name)}
  alt={member.name}
  className="w-12 h-12 rounded-full"
/>

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{member.name}</h3>
            <p className="text-gray-600">{member.role}</p>
          </div>
          {member.performance >= 90 && (
            <Star className="text-yellow-400" />
          )}
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Sprint Progress</span>
            <span className="text-sm font-semibold">{member.progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${member.progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="mx-auto text-green-500 mb-1" />
            <span className="block font-semibold">{member.completed}</span>
            <span className="text-gray-600">Done</span>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <AccessTime className="mx-auto text-blue-500 mb-1" />
            <span className="block font-semibold">{member.inProgress}</span>
            <span className="text-gray-600">Active</span>
          </div>
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Warning className="mx-auto text-yellow-500 mb-1" />
            <span className="block font-semibold">{member.pending}</span>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="p-2 bg-red-100 rounded-lg">
            <Block className="mx-auto text-red-500 mb-1" />
            <span className="block font-semibold">{member.blocked}</span>
            <span className="text-gray-600">Blocked</span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const TeamProgress = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productivityData, setProductivityData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch team members
      const membersSnapshot = await getDocs(collection(db, 'team_members'));
      const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Fetch tasks by status
      const statuses = ['completed', 'active', 'pending', 'blocked'];
      const tasksByStatus = {};
      for (const status of statuses) {
        const statusDoc = await getDoc(doc(db, 'tasks', status));
        tasksByStatus[status] = statusDoc.exists() ? statusDoc.data().items || [] : [];
      }
      // Count tasks per member
      const memberStats = members.map(member => {
        const name = member.name.split(' ')[0]; // Use first name for matching
        const completed = tasksByStatus.completed.filter(item => item.includes(name)).length;
        const inProgress = tasksByStatus.active.filter(item => item.includes(name)).length;
        const pending = tasksByStatus.pending.filter(item => item.includes(name)).length;
        const blocked = tasksByStatus.blocked.filter(item => item.includes(name)).length;
        // Fake progress/performance for now
        const total = completed + inProgress + pending + blocked;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const performance = 80 + Math.floor(Math.random() * 20); // Random for demo
        return {
          ...member,
          completed,
          inProgress,
          pending,
          blocked,
          progress,
          performance
        };
      });
      setTeamMembers(memberStats);
      // Productivity data for Nivo
      setProductivityData(
        memberStats.map(member => ({
          member: member.name.split(' ')[0],
          'Story Points': member.completed * 3 + member.inProgress,
          'Bugs Fixed': member.completed,
          'Code Reviews': member.completed + member.inProgress
        }))
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 ml-16 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 ml-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Team Progress</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {teamMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-6">Sprint Productivity</h2>
          <div className="h-96">
            <ResponsiveBar
              data={productivityData}
              keys={['Story Points', 'Bugs Fixed', 'Code Reviews']}
              indexBy="member"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={{ scheme: 'nivo' }}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Team Member',
                legendPosition: 'middle',
                legendOffset: 32
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Count',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
              animate={true}
              motionStiffness={90}
              motionDamping={15}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TeamProgress; 