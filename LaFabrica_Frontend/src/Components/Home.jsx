import SearchBar from "./Searchbar";
/* Home layout - should output a animated page that transitions from dark gray to light gray, Container
should take up 100 percent of screen, stack items on page using flex-box, should also be centered with the
text Youth Academy Tracker with a image of the soccer ball and search bar
*/
function Home(){
  return(
  <section className="h-screen flex flex-col items-center justify-center
  bg-gradient-to-r from-gray-800 via-gray-600 to-gray-300
  bg-[length:400%_400%] animate-gradient">
    <h1 className="text-5xl font-bold mb-4 text-neutral-900">
      Youth Academy Tracker
    </h1>
    <div className="text-center text-white">
      <img
      src="../LaFabrica_Images/lafabricaball.jpg"
      alt="Soccer Ball Logo"
      className="w-56 mx-auto mb-6"
      />
    </div>
      <div className="flex mx-auto pt-20 w-[40%] min-4-200px">
        {}
        <SearchBar />
      </div>
      <div>

      </div>
      <p className="text-xl">
          Hala Madrid
        </p>
  </section>
  )
}
export default Home;
