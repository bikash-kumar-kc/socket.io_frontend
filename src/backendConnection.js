import axios from 'axios';

export const createRoom = async ({ roomName,password }) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/room/create`,{
        roomName:roomName,
        password:password,
    });


    return response.data.data.room.id;
  } catch (error) {
    console.log(error);
  }
};

export const matchRoom = async ({roomName,password}) =>{

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/room/match`,{
            roomName:roomName,
            password:password,
        });
        return response.data.data.room.id;
    } catch (error) {
        console.log(error.message)
    }
};



