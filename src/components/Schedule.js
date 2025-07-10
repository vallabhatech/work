import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, isSameDay, isWeekend, parse } from 'date-fns';
import {
  Add,
  ChevronLeft,
  ChevronRight,
  AccessTime,
  People,
  Room,
  Today,
  Close
} from '@mui/icons-material';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import db from '../firebase-config.js';

// Helper to normalize time strings for matching
const normalizeTime = (t) => {
  if (!t) return '';
  return t
    .replace(/^0/, '') 
    .replace(':00', '') 
    .replace(/\s+/, '') 
    .replace('.', '') 
    .toLowerCase();
};

const TimeSlot = ({ time, events, isCurrentDay, onClick }) => {
  // Try to match event time with slot time, allowing for '10 AM' vs '10:00 AM'
  const event = events?.find(e => normalizeTime(e.time) === normalizeTime(time));
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`p-2 rounded-lg mb-1 text-sm ${
        event 
          ? 'bg-blue-50 border-l-4 border-blue-500' 
          : isCurrentDay 
            ? 'bg-gray-50 cursor-pointer hover:bg-gray-100'
            : 'bg-transparent cursor-pointer hover:bg-gray-50'
      }`}
      onClick={() => onClick(time, event)}
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-xs w-16">{time}</span>
        {event && (
          <div className="flex-1 ml-2">
            <h4 className="font-medium text-blue-800">{event.event}</h4>
            {event.attendees && (
              <div className="flex items-center text-xs text-gray-500 mt-1 flex-wrap">
                <div className="flex items-center mr-3">
                  <People className="w-3 h-3 mr-1" />
                  <span>{event.attendees}</span>
                </div>
                {event.location && (
                  <div className="flex items-center">
                    <Room className="w-3 h-3 mr-1" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const teamMembersRef = collection(db, 'team_members');
        const snapshot = await getDocs(teamMembersRef);
        const members = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTeamMembers(members);
        
        // Fetch calendar events for each team member
        const events = {};
        for (const member of members) {
          const calendarRef = doc(db, 'calendar', member.id);
          const calendarDoc = await getDoc(calendarRef);
          if (calendarDoc.exists()) {
            events[member.id] = calendarDoc.data().events || [];
          }
        }
        setCalendarEvents(events);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching team data:', error);
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  const weekDays = [...Array(7)]
    .map((_, i) => {
      const date = addDays(startOfWeek(currentDate), i);
      return {
        name: format(date, 'EEE'),
        fullName: format(date, 'EEEE'),
        date: date,
        dayOfMonth: format(date, 'd')
      };
    })
    .filter(day => !isWeekend(day.date));

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM',
    '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  const getEventsForDay = (day) => {
    let allEvents = [];
    if (selectedMemberId) {
      const memberEvents = calendarEvents[selectedMemberId] || [];
      // Debug log
      console.log('Selected member:', selectedMemberId, 'Events:', memberEvents);
      // Compare event.day (e.g., 'Mon') to day.name (e.g., 'Mon')
      const dayEvents = memberEvents.filter(event => {
        // Accept both short and long day names
        const eventDay = event.day.toLowerCase();
        return eventDay === day.name.toLowerCase() || eventDay === day.fullName.toLowerCase();
      });
      allEvents = dayEvents;
    } else {
      Object.values(calendarEvents).forEach(memberEvents => {
        const dayEvents = memberEvents.filter(event => {
          const eventDay = event.day.toLowerCase();
          return eventDay === day.name.toLowerCase() || eventDay === day.fullName.toLowerCase();
        });
        allEvents.push(...dayEvents);
      });
    }
    // Debug log
    if (selectedMemberId) {
      console.log('Events for', day.name, '=>', allEvents);
    }
    return allEvents;
  };

  const handleTimeSlotClick = (date, time, existingEvent) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowNewEventModal(true);
  };

  const handleCreateEvent = async (eventData) => {
    try {
      // Get the user's calendar document
      const userCalendarRef = doc(db, 'calendar', eventData.userId);
      const userCalendarDoc = await getDoc(userCalendarRef);
      
      let existingEvents = [];
      if (userCalendarDoc.exists()) {
        existingEvents = userCalendarDoc.data().events || [];
      }

      // Add the new event
      const newEvent = {
        day: format(selectedDate, 'EEE'),
        time: selectedTime,
        event: eventData.title,
        attendees: eventData.attendees,
        location: eventData.location
      };

      await setDoc(userCalendarRef, {
        events: [...existingEvents, newEvent]
      });

      // Refresh the calendar events
      const updatedEvents = { ...calendarEvents };
      if (!updatedEvents[eventData.userId]) {
        updatedEvents[eventData.userId] = [];
      }
      updatedEvents[eventData.userId].push(newEvent);
      setCalendarEvents(updatedEvents);
      
      setShowNewEventModal(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 ml-16 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Sidebar for team members */}
      <div className="w-48 bg-white border-r border-gray-200 py-6 px-2 mr-4 rounded-xl h-fit self-start sticky top-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Team Members</h3>
        <button
          className={`block w-full text-left px-3 py-2 mb-2 rounded-lg font-medium ${!selectedMemberId ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
          onClick={() => setSelectedMemberId(null)}
        >
          Show All
        </button>
        {teamMembers.map(member => (
          <button
            key={member.id}
            className={`block w-full text-left px-3 py-2 mb-2 rounded-lg font-medium ${selectedMemberId === member.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setSelectedMemberId(member.id)}
          >
            {member.name}
          </button>
        ))}
      </div>
      {/* Main calendar content */}
      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-[1000px] mx-auto pr-200"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Today className="text-blue-500 mr-3 w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Team Schedule</h1>
                <p className="text-gray-500 text-sm">{format(currentDate, 'MMMM yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
                onClick={() => setCurrentDate(addDays(currentDate, -7))}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
                onClick={() => setCurrentDate(addDays(currentDate, 7))}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                onClick={() => setShowNewEventModal(true)}
              >
                <Add className="w-4 h-4 mr-1" />
                New Meeting
              </motion.button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Calendar Header */}
            <div className="grid grid-cols-5 border-b">
              {weekDays.map((day) => (
                <div 
                  key={day.name} 
                  className={`p-2 text-center border-r last:border-r-0 ${
                    isSameDay(day.date, new Date()) ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-gray-500 text-xs">{day.name}</p>
                  <p className={`text-base font-semibold ${
                    isSameDay(day.date, new Date()) ? 'text-blue-500' : 'text-gray-700'
                  }`}>
                    {day.dayOfMonth}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="grid grid-cols-5 divide-x">
              {weekDays.map((day) => {
                const eventsForDay = getEventsForDay(day);
                return (
                  <div key={day.name} className="min-w-[100px]">
                    {eventsForDay.length === 0 && selectedMemberId && (
                      <div className="text-xs text-gray-400 text-center py-2">No events</div>
                    )}
                    {timeSlots.map((time) => (
                      <TimeSlot
                        key={`${day.name}-${time}`}
                        time={time}
                        events={eventsForDay}
                        isCurrentDay={isSameDay(day.date, new Date())}
                        onClick={(time, event) => handleTimeSlotClick(day.date, time, event)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Meeting Modal */}
          {showNewEventModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-6 rounded-xl w-[480px] shadow-xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Schedule New Meeting</h2>
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNewEventModal(false)}
                  >
                    <Close className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter meeting title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organizer
                    </label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select team member</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={selectedTime || ''}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>1.5 hours</option>
                      <option>2 hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attendees
                    </label>
                    <select 
                      multiple
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                    >
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Meeting room or virtual link"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    onClick={() => setShowNewEventModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={() => handleCreateEvent({
                      // Add event creation logic here
                    })}
                  >
                    Schedule Meeting
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Schedule; 