import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, BookOpen, Users, Shield } from 'lucide-react';
export function PortalSelector() {
  const portals = [
  {
    name: 'Public Website',
    path: '/public',
    icon: Globe,
    desc: 'Prospective learners & enrollment',
    color: 'bg-blue-50 text-blue-600'
  },
  {
    name: 'Learner Portal',
    path: '/learner',
    icon: BookOpen,
    desc: 'Enrolled learners dashboard',
    color: 'bg-qore-light text-qore-medium'
  },
  {
    name: 'Instructor Portal',
    path: '/instructor',
    icon: Users,
    desc: 'Cohort management & grading',
    color: 'bg-purple-50 text-purple-600'
  },
  {
    name: 'Admin Dashboard',
    path: '/admin',
    icon: Shield,
    desc: 'Platform operations & revenue',
    color: 'bg-orange-50 text-orange-600'
  }];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{
          opacity: 0,
          y: -20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        className="text-center mb-12">
        
        <img
          src="/qorepath.webp"
          alt="QorePath Logo"
          className="h-16 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-qore-text mb-2">
          Welcome to QorePath Platform
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Select a portal to explore the different user experiences within the
          Live Cohort Learning Academy.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {portals.map((portal, index) =>
        <motion.div
          key={portal.name}
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: index * 0.1
          }}>
          
            <Link
            to={portal.path}
            className="block bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-qore-highlight group">
            
              <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${portal.color} group-hover:scale-110 transition-transform`}>
              
                <portal.icon size={28} />
              </div>
              <h2 className="text-xl font-semibold text-qore-text mb-2">
                {portal.name}
              </h2>
              <p className="text-gray-500">{portal.desc}</p>
            </Link>
          </motion.div>
        )}
      </div>
    </div>);

}