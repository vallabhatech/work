import React from 'react';
import { motion } from 'framer-motion';
import { 
  Dashboard, 
  Schedule, 
  People, 
  Info
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarIcon = ({ icon, text, active, onClick }) => {
  return (
    <div className="relative group" onClick={onClick}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`sidebar-icon ${active ? 'bg-green-600 text-white' : ''}`}
      >
        {icon}
      </motion.div>
      <span className="sidebar-tooltip group-hover:scale-100">
        {text}
      </span>
    </div>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routes = [
    { path: '/', icon: <Dashboard />, text: 'Dashboard' },
    { path: '/schedule', icon: <Schedule />, text: 'Schedule' },
    { path: '/team', icon: <People />, text: 'Team Progress' },
    { path: '/about', icon: <Info />, text: 'About' },
  ];

  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: 'auto' }}
      className="fixed left-0 top-0 h-screen w-16 m-0 flex flex-col
                bg-gray-900 text-white shadow-lg z-40"
    >
      <div className="flex flex-col items-center mt-4">
        {routes.map((route) => (
          <SidebarIcon
            key={route.path}
            icon={route.icon}
            text={route.text}
            active={location.pathname === route.path}
            onClick={() => navigate(route.path)}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default Sidebar; 