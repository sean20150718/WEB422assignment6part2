import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '../lib/authenticate';
import { useAtom } from 'jotai';
import { favouritesAtom, searchHistoryAtom } from '@/store';
import { getFavourites, getHistory } from '@/lib/userData';

const PUBLIC_PATHS = ['/login', '/', '/_error', '/register'];

export default function RouteGuard(props) {
  const [favouritesList, setFavouritesList] = useAtom(favouritesAtom);
  const [searchHistory, setSearchHistory] = useAtom(searchHistoryAtom);
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  async function updateAtoms() {
    setFavouritesList(await getFavourites());
    setSearchHistory(await getHistory());
  }

  useEffect(() => {
    function authCheck(url) {
      // redirect to login page if accessing a private page and not logged in
      const path = url.split('?')[0];
      if (!isAuthenticated() && !PUBLIC_PATHS.includes(path)) {
        setAuthorized(false);
        router.push('/login');
      } else {
        setAuthorized(true);
      }
    }

    // on initial load - run auth check
    authCheck(router.pathname);

    // on route change complete - run auth check
    const handleRouteChange = () => authCheck(router.pathname);
    router.events.on('routeChangeComplete', handleRouteChange);

    // unsubscribe from events in useEffect return function
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]); // Include router in the dependency array

  return <>{authorized && props.children}</>;
}