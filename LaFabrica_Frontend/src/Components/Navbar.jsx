import { useState } from 'react';
import {Link} from 'react-router-dom'
/*Responsive Navbar that allows user to click each section of the page, Home, Players, and Contact using links for faster
responsive instead of anchor tags uses useState for mobile hamburger menu implementation.
*/
function Navbar(){
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className = "bg-white shadow-md shadow-black/40">
    <div className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
    
    <div className="shrink-0">
      <Link to="/" className="text-2xl font-bold text-blue-700">
        La Fabrica Tracker
      </Link> 
    </div >
    <div className="hidden md:flex space-x-8">
        <Link to ="/" className="text-gray-700 hover:text-blue-700 px-3 py-2 font-semibold">
        Home
        </Link>
        <Link to ="/Players" className="text-gray-700 hover:text-blue-700 px-3 py-2 font-semibold">
        Players
        </Link>
        <Link to ="/Contact" className="text-gray-700 hover:text-blue-700 px-3 py-2 font-semibold">
        Contact
        </Link>
    </div>
    <div className="md:hidden">
        <button onClick={()=> setIsOpen(!isOpen)}
          className="text-gray-700 hover:text-blue-700 focus:outline-none">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24"stroke="currentColor">
            {isOpen && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/> 
            )}
    {!isOpen && (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
     )} 
      </svg>
     </button>
      </div>
    </div>
  </div>
  {isOpen && (
    <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/" className=" block text-gray-700 hover:bg-blue-50 hover:text-blue-700 px-3 py-2 font-semibold "
            onClick={() => setIsOpen(false)}>
              Home
            </Link>
            <Link to="/Players" className=" block text-gray-700 hover:bg-blue-50 hover:text-blue-700 px-3 py-2 font-semibold "
            onClick={() => setIsOpen(false)}>
              Players
            </Link>
            <Link to="/Contact" className=" block text-gray-700 hover:bg-blue-50 hover:text-blue-700 px-3 py-2 font-semibold "
            onClick={() => setIsOpen(false)}>
              Contact
            </Link>
          </div>
          </div>    
  )}
</nav>
);
}
export default Navbar;
