import { useEffect, useState } from "react";

import io from "socket.io-client";

const api = "locald";
const hostname = window.location.hostname;

const URL =
    api === "local"
        ? `http://${hostname}:5000`
        : "chat-app-production-30bc.up.railway.app";

const socket = io.connect(`${URL}`, { transports: ["websocket"] });
const Home = () => {
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState();
    const [currentUser, setCurrentUser] = useState("");
    const [existingUser, setExistingUser] = useState(false);

    const [chatWith, setChatWith] = useState("");

    const [data, setData] = useState({ content: "", status: 1 });
    const [messages, setMessages] = useState({});

    // ! join default room
    const saveCurrentUser = () => {
        setExistingUser(true);
        socket.emit("client-to-server--default-room", { currentUser });
    };

    // ! function to join a room
    const recieveChat = (recievedData) => {
        const newRoom = [recievedData.currentUser, recievedData.chat_user]
            .sort()
            .join("");

        setRooms((previousState) => [...previousState, newRoom]);
        setActiveRoom(newRoom);
        setMessages((previousState) => {
            return {
                ...previousState,
                [newRoom]: [],
            };
        });
        socket.emit("client-to-server--join-room", {
            currentUser: recievedData.currentUser,
            chat_user: recievedData.chat_user,
        });
    };

    // ! function to join a room
    const createChat = (e) => {
        const chat_user = chatWith;
        const newRoom = [currentUser, chat_user].sort().join("");

        setRooms((previousState) => [...previousState, newRoom]);
        setActiveRoom(newRoom);
        setMessages((previousState) => {
            return {
                ...previousState,
                [newRoom]: [],
            };
        });
        setChatWith("");
        socket.emit("client-to-server--join-room", { currentUser, chat_user });
    };

    // ! function to send message
    const sendMessage = (e) => {
        e.preventDefault();
        // @ send the message to the server
        socket.emit("client-to-server", { data, activeRoom });

        // @ add the client messages
        setMessages((previousState) => {
            return {
                ...previousState,
                [activeRoom]: [...previousState[activeRoom], data],
            };
        });
    };

    useEffect(() => {
        // @ first message
        socket.on("server-to-client--first-message", (recievedData) => {
            recieveChat(recievedData);
        });

        // @ add new message from server
        socket.on("server-to-client", (recievedData) => {
            const messagesData = {
                content: recievedData.content,
                status: 0,
            };
            const room = recievedData.room;
            setMessages((previousState) => {
                return {
                    ...previousState,
                    [room]: [...previousState[room], messagesData],
                };
            });
        });
    }, [socket]);

    const randomId = () => {
        return "" + Math.random() * 200000;
    };
    return (
        <>
            {existingUser ? (
                <div className="flex ">
                    <div className="w-[30vw] h-screen bg-red-500">
                        {rooms.map((room) => {
                            return (
                                <div
                                    key={randomId()}
                                    className={`py-2 px-4 bg-[#9be9ed] hover:bg-[#efef99] cursor-pointer 
                            ${activeRoom === room ? "bg-sky-600" : ""}`}
                                    onClick={() => setActiveRoom(room)}
                                >
                                    {room}
                                </div>
                            );
                        })}
                    </div>
                    <div className=" flex flex-col justify-between h-screen w-[70vw] items-center bg-green-100 gap-4">
                        <div>
                            <div className="flex gap-4 ">
                                <div className="flex flex-col bg-red-50 p-4">
                                    <input
                                        className="px-4 py-2"
                                        placeholder="enter user 2"
                                        value={chatWith}
                                        onChange={(e) =>
                                            setChatWith(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className=" flex items-center justify-center">
                                <button
                                    onClick={createChat}
                                    className="px-4 py-2 bg-[#65c8e3]"
                                >
                                    add chat
                                </button>
                            </div>
                        </div>
                        {/* this is end input of channel   */}

                        <div className="flex flex-col items-center bg-green-900   ">
                            <div className=" w-80 bg-red-200 flex flex-col ">
                                {messages[activeRoom]?.map((item) => {
                                    return (
                                        <div
                                            key={randomId()}
                                            className={` w-fit p-2 m-0.5 
                                    ${
                                        item.status
                                            ? "bg-yellow-600 self-start"
                                            : "bg-blue-600 self-end"
                                    }
                                `}
                                        >
                                            {item.content}
                                        </div>
                                    );
                                })}
                            </div>
                            <form
                                onSubmit={sendMessage}
                                className="flex bg-red-500 w-80 "
                            >
                                <input
                                    value={data.content}
                                    onChange={(e) =>
                                        setData((previousState) => ({
                                            ...previousState,
                                            content: e.target.value,
                                        }))
                                    }
                                />
                                <button
                                    className="px-4 py-2 bg-red-200 w-full border-2 border-black"
                                    onClick={sendMessage}
                                >
                                    send message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-screen h-screen bg-red-300 flex   items-center">
                    <div className="w-80 h-40 bg-green-200">
                        <div className="flex flex-col bg-red-50 p-4">
                            <input
                                className="px-4 py-2"
                                placeholder="enter your number "
                                value={currentUser}
                                onChange={(e) => setCurrentUser(e.target.value)}
                            />
                            <div className=" flex items-center justify-center">
                                <button
                                    onClick={saveCurrentUser}
                                    className="px-4 py-2 bg-[#65c8e3]"
                                >
                                    submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Home;
