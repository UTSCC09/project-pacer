import React from 'react';
import { Route, Navigate } from 'react-router-dom';

import { authenticationService } from './../_services';
import { history, Role } from '../_helpers';

function PrivateRoute({ isAllowed, redirectPath='/login', children }) {
        console.log(isAllowed)

        if (!isAllowed) {
            console.log("is not allowed")
            // not logged in so redirect to login page with the return url
            return <Navigate to={redirectPath} state={{ from: history.location }}/>
        }

        // if (isAdmin && currentUser.role === Role.Admin) {
        //     return <Navigate to='/teacher' state={{ from: history.location }} />
        // }

        // if (roles[0] === Role.User && currentUser.role === Role.User) {
        //     return <Navigate to='/student' state={{ from: history.location }} />
        // }

        // // check if route is restricted by role
        // if (roles && roles.indexOf(currentUser.role) === -1) {
        //     // role not authorised so redirect to home page
        //     return <Navigate to='/login' />
        // }



        // authorised so return component
        return children
}

export { PrivateRoute }