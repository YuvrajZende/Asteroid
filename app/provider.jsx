'use client'
import { supabase } from "@/services/supabase";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { UserContext } from "@/context/UserContext";


function Provider({ children }) {

    const {user}=useUser();
    const [userDetails,setUserDetails] = useState();
    useEffect(() => {
        user&&CreateNewUser();
    }, [user]);

    const CreateNewUser = async() => {
        try {
            // if already user exists or not
            let { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email',user?.primaryEmailAddress.emailAddress);

            if (error) {
                console.error('Error checking user:', error);
                return;
            }

            if(users.length===0){
                const { data, error } = await supabase
                .from('users')
                .insert([
                    {
                        name: user?.fullName,
                        email: user?.primaryEmailAddress.emailAddress
                    },
                ])
                .select()
                
                if (error) {
                    console.error('Error creating user:', error);
                    return;
                }
                
                setUserDetails(data[0]);
                return;      
            }

            setUserDetails(users[0]);
        } catch (error) {
            console.error('Error in CreateNewUser:', error);
        }
    }
    return (
        <UserContext.Provider value={{userDetails,setUserDetails}}>
            <div className='w-full'>{children}</div>
        </UserContext.Provider>

    )
}

export default Provider;