import { useEffect, useRef, useState } from "react";
import socketIoConnectionToServer from "./socket/ws.js";
import { createRoom } from "./backendConnection.js";
import { matchRoom } from "./backendConnection.js";

function App() {
  // variable to persist in each render...
  const socket = useRef(null);
  const timeOut = useRef(null);

  // state-variable...
  const [msgs, setMsgs] = useState([]);
  const [typingUser, setTypingUser] = useState([]);
  const [startChat, setStartChat] = useState(true);
  const [user, setUser] = useState("");
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [text, setText] = useState("");
  const [createNewRoom, setCreateNewRoom] = useState(false);
  const [joinExistingRoom, setJoinExistingRoom] = useState(false);

  // useEffect to do socket io connection ...
  useEffect(() => {
    socket.current = socketIoConnectionToServer();

    socket.current.on("connect", () => {
      console.log("successfully connected !!");

      socket.current.on("roomNotice", (userName) => {
        console.log("new member joined:: ", userName);
      });

      socket.current.on("chatMessage", (msg) => {
        // push to existing messages list
        console.log("new message arrived:: ", msg);
        setMsgs((prevs) => [...prevs, msg]);
      });

      socket.current.on("start-typing", (userName) => {
        console.log("typing started:: ", userName);

        setTypingUser((prevs) => {
          const isExist = prevs.includes(userName);
          if (!isExist) {
            return [...prevs, userName];
          }

          return prevs;
        });
      });

      socket.current.on("stop-typing", (userName) => {
        console.log("stoping typing:: ", userName);
        setTypingUser((prevs) => prevs.filter((typer) => typer !== userName));
      });
    });

    return () => {
      socket.current.off("roomNotice");
      socket.current.off("chatMessage");
      socket.current.off("start-typing");
      socket.current.off("stop-typing");
    };
  }, []);

  // useEffect to look setTimeOut
  useEffect(() => {
    if (text) {
      socket.current.emit("start-typing", user);
      clearTimeout(timeOut.current);
    }

    timeOut.current = setTimeout(() => {
      socket.current.emit("stop-typing", user);
    }, 1000);

    return () => {
      clearTimeout(timeOut.current);
    };
  }, [text, user]);

  // FORMAT TIMESTAMP TO HH:MM FOR MESSAGES...
  function formatTime(ts) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // CREATE NEW ROOM...
  const handleCreateRoomSubmit = async (e) => {
    e.preventDefault();

    const userName = user.trim();
    const newRoomName = roomName.trim();
    const roomPassword = password.trim();
    if (!newRoomName || !userName || !roomPassword) return;

    // creating room...

    const roomId = await createRoom({ roomName, password });

    if (!roomId) return;

    // join room
    const connection = await socket.current.emit("joinRoom", {
      roomName: roomName,
      roomId: roomId,
    });

    if (connection) {
      setStartChat(false);
      setCreateNewRoom(false);
    }
  };

  // JOIN EXISTING ROOM...
  const handleJoinExistingRoom = async (e) => {
    e.preventDefault();
    const userName = user.trim();
    const oldRoomName = roomName.trim();
    const oldRoomPassword = password.trim();
    if (!oldRoomName || !userName || !oldRoomPassword) return;

    const roomId = await matchRoom({
      roomName: oldRoomName,
      password: oldRoomPassword,
    });

    if (!roomId) return;

    const connection = await socket.current.emit("joinRoom", {
      roomName: oldRoomName,
      roomId: oldRoomPassword,
    });

    if (connection) {
      setStartChat(false);
      setJoinExistingRoom(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;

    const userMsg = {
      id: Date.now(),
      sender: user,
      text: t,
      ts: Date.now(),
    };

    setMsgs((prevs) => [...prevs, userMsg]);

    // emit...
    socket.current.emit("chatMessage", userMsg);
    setText("");
  };

  // HANDLE ENTER KEY TO SEND MESSAGE...
  const handleEnterKeyToSendMessage = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  p-4 font-inter">
      {!!startChat && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl shadow-lg max-w-md p-6">
            <h1 className="text-xl font-semibold text-black">Hey user,</h1>
            <p className="text-sm text-gray-500 mt-3">
              Do you want to create <b>personal room</b> or join to{" "}
              <b>existing room?</b>
            </p>

            <div className="flex justify-between mt-5">
              <button
                className="block  mt-3 px-4 py-1.5 rounded-full bg-green-500 text-white font-medium cursor-pointer hover:bg-green-600 transition duration-300"
                onClick={() => {
                  setCreateNewRoom((prev) => !prev);
                  setStartChat((prev) => !prev);
                }}
              >
                create new room
              </button>
              <button
                className="block ml-auto mt-3 px-4 py-1.5 rounded-full bg-green-500 text-white font-medium cursor-pointer hover:bg-green-600 transition duration-300"
                onClick={() => {
                  setJoinExistingRoom((prev) => !prev);
                  setStartChat((prev) => !prev);
                }}
              >
                existing room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* create new room... */}
      {createNewRoom && (
        <div className="fixed inset-0 flex items-center justify-center z-40 ">
          <div className="bg-white rounded-xl shadow-lg  w-100 p-6">
            <h1 className="text-xl font-semibold text-black">Hey user,</h1>
            <p className="text-sm text-gray-500 mt-3">
              Create <b>new room</b>
            </p>
            <form
              onSubmit={handleCreateRoomSubmit}
              className="mt-4 flex flex-col gap-3"
            >
              <input
                autoFocus
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 outline-green-500 placeholder-gray-400"
                placeholder="Your name..."
              />
              <input
                autoFocus
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 outline-green-500 placeholder-gray-400"
                placeholder="Enter room name"
              />
              <input
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 outline-green-500 placeholder-gray-400"
                placeholder="Enter room password"
              />
              <button
                type="submit"
                className="block ml-auto mt-3 px-4 py-1.5 rounded-full bg-green-500 text-white font-medium cursor-pointer"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* joining existing room */}
      {joinExistingRoom && (
        <div className="fixed inset-0 flex items-center justify-center z-40 ">
          <div className="bg-white rounded-xl shadow-lg w-100 p-6">
            <h1 className="text-xl font-semibold text-black">Hey user,</h1>
            <p className="text-sm text-gray-500 mt-3">
              Join <b>existing room</b>
            </p>
            <form
              onSubmit={handleCreateRoomSubmit}
              className="mt-4 flex flex-col gap-3"
            >
              <input
                autoFocus
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 outline-green-500 placeholder-gray-400"
                placeholder="Your name..."
              />
              <input
                autoFocus
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 outline-green-500 placeholder-gray-400"
                placeholder="Enter room name"
              />
              <input
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 outline-green-500 placeholder-gray-400"
                placeholder="Enter room password"
              />
              <button
                type="submit"
                className="block ml-auto mt-3 px-4 py-1.5 rounded-full bg-green-500 text-white font-medium cursor-pointer"
                onClick={handleJoinExistingRoom}
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHAT WINDOW */}
      {!createNewRoom && !startChat && !joinExistingRoom && (
        <div className="w-full max-w-2xl h-[90vh] bg-[#1e293b] rounded-xl shadow-md flex flex-col overflow-hidden">
          {/* CHAT HEADER */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <div className="h-10 w-10 rounded-full bg-[#075E54] flex items-center justify-center text-white font-semibold">
              R
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">
                Realtime group chat
              </div>

              {typingUser.length ? (
                <div className="text-xs text-white">
                  {typingUser.join(", ")} is typing...
                </div>
              ) : (
                ""
              )}
            </div>
            <div className="text-sm text-[#e5e5e5]">
              Signed in as:{" "}
              <span className="font-medium text-[#e5e5e5] capitalize">
                {user}
              </span>
            </div>
          </div>

          {/* CHAT MESSAGE LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-100 flex flex-col">
            {msgs.map((m) => {
              const mine = m.sender === user;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] p-3 my-2 rounded-[18px] text-sm leading-5 shadow-sm ${
                      mine
                        ? "bg-[#DCF8C6] text-[#303030] rounded-br-2xl"
                        : "bg-white text-[#303030] rounded-bl-2xl"
                    }`}
                  >
                    <div className="wrap-break-word whitespace-pre-wrap">
                      {m.text}
                    </div>
                    <div className="flex justify-between items-center mt-1 gap-16">
                      <div className="text-[11px] font-bold">{m.sender}</div>
                      <div className="text-[11px] text-gray-500 text-right">
                        {formatTime(m.ts)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CHAT TEXTAREA */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-4 border border-gray-200 rounded-full">
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleEnterKeyToSendMessage}
                placeholder="Type a message..."
                className="w-full resize-none px-4 py-4 text-sm outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-green-500 text-white px-4 py-2 mr-2 rounded-full text-sm font-medium cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default App;
