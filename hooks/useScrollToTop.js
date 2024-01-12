import {useEffect} from "react";

const useScrollToTop = (trigger) => {
  const moveToTopOfPage = () => window.scrollTo({top: 0, behavior: 'smooth'});
  useEffect(() => {moveToTopOfPage()}, [trigger]);
};

export default useScrollToTop;