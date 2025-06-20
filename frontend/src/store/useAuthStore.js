import {  create  } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";



export const useAuthStore = create( (set) => ({

    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],

    checkAuth: async() => {

        try{

            const res = await axiosInstance.get("/auth/check");

            set({authUser: res.data});
        }

        catch(error){
            console.log("Error in checkAuth", error);
            set({authUser: null});

        }

        finally{
            set({isCheckingAuth: false});
        }

    },

    signup: async (data) => {
        set ({  isSigningUp: true});

        try {
          const res =  await axiosInstance.post("/auth/signup", data);
                  set({authUser: res.data});
                  toast.success("Account created successfully");
        }

        catch(error){
            toast.error(error.response.data.message);
        }

        finally{
            set({  isSigningUp: false  });
        }

    },

    login: async (data) => {
        set({  isLoggingIn: true });

        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Logged in successfully");
        }

        catch(error){
            toast.error(error.response.data.message);
        }

        finally{
            set({  isLoggingIn: false });
        }
    },


    logout: async () => {

        try{
            await axiosInstance.post("/auth/logout");
            set({  authUser: null });
            toast.success("logged out successfully");
        }

        catch(error){
            toast.error(error.response.data.message);

        }
    },

updateProfile: async (data) => {
    set({ isUpdatingProfile: true });

    try {
        let payload = data;

        // Handle file uploads with FormData
        if (data.file) {
            payload = new FormData();
            Object.keys(data).forEach((key) => {
                payload.append(key, data[key]);
            });
        }

        const res = await axiosInstance.put("/auth/update-profile", payload, {
            headers: {
                "Content-Type": data.file ? "multipart/form-data" : "application/json",
            },
        });

        set({ authUser: res.data });
        toast.success("Profile updated successfully");
    } catch (error) {
        console.error("Error in update profile:", error);
        toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
        set({ isUpdatingProfile: false });
    }
},

}));