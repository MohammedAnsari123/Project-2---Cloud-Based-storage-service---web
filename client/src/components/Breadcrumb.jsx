import React, { useMemo } from 'react'
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react'; // Adding icons because it looks better

const Breadcrumb = ({ path = [], user }) => {
  const rootName = useMemo(() => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "My Drive";
  }, [user]);

  return (
    <div className='flex items-center gap-2 p-2 text-sm text-gray-600 overflow-x-auto whitespace-nowrap mb-2'>
      <Link to="/" className='flex items-center gap-1 hover:text-blue-600 hover:bg-gray-100 px-2 py-1.5 rounded-lg transition-colors'>
        <Home size={16} />
        <span className='font-medium'>{rootName}</span>
      </Link>

      {path.map(folder => (
        <React.Fragment key={folder.id}>
          <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
          <Link
            to={`/folder/${folder.id}`}
            className='hover:text-blue-600 hover:bg-gray-100 px-2 py-1.5 rounded-lg transition-colors truncate max-w-[150px]'
            title={folder.name}
          >
            {folder.name}
          </Link>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb
