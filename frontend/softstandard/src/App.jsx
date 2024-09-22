import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import './App.css';
import {Tabs} from "antd";
import {Image} from "antd";
import Register from "./components/Register.jsx";
import Login from "./components/Login.jsx";
import Logout from "./components/Logout.jsx";
import Jobs from "./components/Jobs.jsx";
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import axios from "axios";

const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  console.log("isAuthenticated: ", isAuthenticated);

  const checkAuth = async () => {
    try {
      let res = await fetch('http://localhost:3000/checkAuth', {credentials: 'include'});
      res = await res.json();
      setIsAuthenticated(res.isAuthenticated);
    } catch (error) {
      console.error('Auth check failed', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const items = [
    {
      key: '1',
      label: 'Register',
      children: !isAuthenticated ? <Register/> : <></>
    },
    {
      key: '2',
      label: 'Login',
      children: <Login/>
    },
    {
      key: '3',
      label: 'Logout',
      children: <Logout/>
    },
    {
      key: '4',
      label: 'Jobs',
      children: isAuthenticated ? <Jobs/> : <Login/>
    }
  ];

  return (
    <QueryClientProvider client={queryClient}>
       <div className="logo">
          <Image src="logo.jpg" className="logo" preview={false}/>
        </div>
        <div>
          <Tabs defaultActiveKey="1" items={items}/>
        </div>
     </QueryClientProvider>
  )
}

export default App
