// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import {
//   MessageCircle,
//   Send,
//   X,
//   Calendar,
//   Clock,
//   Edit3,
//   Mail,
//   CheckCircle,
//   AlertTriangle,
// } from "lucide-react";

// const PatientChatbot = ({ patientID, hospitalID }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     { from: "bot", text: "Hey 👋! Type 'hi' to begin or choose an option below." },
//   ]);
//   const [input, setInput] = useState("");
//   const [chatState, setChatState] = useState("idle");
//   const [tempBooking, setTempBooking] = useState({
//     hospitalId: hospitalID || "",
//     patientId: patientID || "",
//     doctorId: "",
//     doctorName: "",
//     date: "",
//     time: "",
//     reason: "",
//     email: "",
//   });
//   const chatEndRef = useRef(null);
//   const webhookUrl = "http://localhost:5678/webhook/chatbot";

//   // 🔄 Auto-scroll
//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // 💬 Send message logic
//   const sendMessage = async (msg) => {
//     if (!msg.trim()) return;
//     setMessages((prev) => [...prev, { from: "user", text: msg }]);
//     setInput("");

//     // 🩺 Doctor selected (handle object {name, id})
//     if (msg.startsWith("doctor:")) {
//       const [_, id, name] = msg.split(":");
//       setTempBooking((prev) => ({ ...prev, doctorId: id, doctorName: name }));

//       setMessages((prev) => [
//         ...prev,
//         { from: "bot", text: `You selected Dr. ${name} 🩺` },
//         { from: "bot", text: "Please select your appointment date:" },
//         { from: "bot", type: "date" },
//       ]);

//       setChatState("date");
//       return;
//     }

//     // 📅 Date
//     if (chatState === "date") {
//       setTempBooking((prev) => ({ ...prev, date: msg }));
//       setMessages((prev) => [
//         ...prev,
//         { from: "bot", text: "Great! Now pick a suitable time ⏰" },
//         { from: "bot", type: "time" },
//       ]);
//       setChatState("time");
//       return;
//     }

//     // ⏰ Time
//     if (chatState === "time") {
//       setTempBooking((prev) => ({ ...prev, time: msg }));
//       setMessages((prev) => [
//         ...prev,
//         { from: "bot", text: "Got it! What’s the reason for your visit? 🩺" },
//         { from: "bot", type: "reason" },
//       ]);
//       setChatState("reason");
//       return;
//     }

//     // 💬 Reason
//     if (chatState === "reason") {
//       setTempBooking((prev) => ({ ...prev, reason: msg }));
//       setMessages((prev) => [
//         ...prev,
//         { from: "bot", text: "Please enter your email 📧 for confirmation:" },
//         { from: "bot", type: "email" },
//       ]);
//       setChatState("email");
//       return;
//     }

//     // 📧 Email
//     if (chatState === "email") {
//       const booking = { ...tempBooking, email: msg };
//       setTempBooking(booking);
//       setChatState("idle");

//       setMessages((prev) => [
//         ...prev,
//         { from: "bot", text: "Booking your appointment... please wait ⏳" },
//       ]);

//       await sendToN8n({ text: "book", booking });
//       return;
//     }

//     // Default message → send to n8n
//     await sendToN8n({ text: msg });
//   };

//   // 🌐 Send to n8n webhook
//   const sendToN8n = async (payload) => {
//     try {
//       const res = await axios.post(webhookUrl, {
//         chatId: patientID || "guest-123",
//         text: payload.text,
//         booking: payload.booking || null,
//       });

//       const data = res.data?.body || res.data || {};
//       const botReply =
//         typeof data.reply === "string"
//           ? data.reply.trim().replace(/^=/, "")
//           : "🤖 Sorry, I didn’t understand that.";

//       let options = [];
//       if (Array.isArray(data.options)) options = data.options;
//       else if (typeof data.options === "string") {
//         try {
//           options = JSON.parse(data.options);
//         } catch {
//           options = [];
//         }
//       }

//       setMessages((prev) => [...prev, { from: "bot", text: botReply }]);

//       // Render doctor options
//       if (options.length > 0) {
//         const formattedOptions = options.map((opt) => {
//           if (opt.id && opt.name)
//             return {
//               text: `${opt.name} — ${opt.specialization || "General"}`,
//               payload: `doctor:${opt.id}:${opt.name}`,
//             };
//           return opt;
//         });
//         setMessages((prev) => [...prev, { from: "options", buttons: formattedOptions }]);
//       }
//     } catch (err) {
//       console.error("Chatbot Error:", err);
//       setMessages((prev) => [
//         ...prev,
//         { from: "bot", text: "⚠️ Sorry, I couldn’t reach the chatbot server." },
//       ]);
//     }
//   };

//   // 🗨️ Render messages
//   const renderMessages = () =>
//     messages.map((msg, idx) => {
//       if (msg.type === "date")
//         return (
//           <div key={idx} className="mb-3 d-flex justify-content-start">
//             <div className="p-3 rounded-4 bg-light shadow-sm w-100">
//               <label className="fw-semibold mb-1 d-flex align-items-center gap-2">
//                 <Calendar size={16} /> Choose Date:
//               </label>
//               <input
//                 type="date"
//                 className="form-control"
//                 onChange={(e) => sendMessage(e.target.value)}
//               />
//             </div>
//           </div>
//         );

//       if (msg.type === "time")
//         return (
//           <div key={idx} className="mb-3 d-flex justify-content-start">
//             <div className="p-3 rounded-4 bg-light shadow-sm w-100">
//               <label className="fw-semibold mb-1 d-flex align-items-center gap-2">
//                 <Clock size={16} /> Select Time:
//               </label>
//               <input
//                 type="time"
//                 className="form-control"
//                 onChange={(e) => sendMessage(e.target.value)}
//               />
//             </div>
//           </div>
//         );

//       if (msg.type === "reason")
//         return (
//           <div key={idx} className="mb-3 d-flex justify-content-start">
//             <div className="p-3 rounded-4 bg-light shadow-sm w-100">
//               <label className="fw-semibold mb-1 d-flex align-items-center gap-2">
//                 <Edit3 size={16} /> Reason for Visit:
//               </label>
//               <input
//                 type="text"
//                 placeholder="e.g., fever, check-up"
//                 className="form-control"
//                 onKeyDown={(e) =>
//                   e.key === "Enter" && sendMessage(e.target.value)
//                 }
//               />
//             </div>
//           </div>
//         );

//       if (msg.type === "email")
//         return (
//           <div key={idx} className="mb-3 d-flex justify-content-start">
//             <div className="p-3 rounded-4 bg-light shadow-sm w-100">
//               <label className="fw-semibold mb-1 d-flex align-items-center gap-2">
//                 <Mail size={16} /> Email Address:
//               </label>
//               <input
//                 type="email"
//                 placeholder="yourname@example.com"
//                 className="form-control"
//                 onKeyDown={(e) =>
//                   e.key === "Enter" && sendMessage(e.target.value)
//                 }
//               />
//             </div>
//           </div>
//         );

//       if (msg.from === "options")
//         return (
//           <div
//             key={idx}
//             className="d-flex flex-wrap gap-2 mt-3 mb-2 justify-content-start"
//           >
//             {msg.buttons.map((b, i) => (
//               <button
//                 key={i}
//                 className="btn btn-sm btn-outline-primary px-3 rounded-pill shadow-sm"
//                 onClick={() => sendMessage(b.payload || b.text || b)}
//               >
//                 {b.text || b.payload || b}
//               </button>
//             ))}
//           </div>
//         );

//       return (
//         <div
//           key={idx}
//           className={`d-flex mb-3 ${
//             msg.from === "user" ? "justify-content-end" : "justify-content-start"
//           }`}
//         >
//           <div
//             className={`p-3 rounded-4 ${
//               msg.from === "user"
//                 ? "bg-primary text-white"
//                 : "bg-light text-dark"
//             }`}
//             style={{ maxWidth: "75%" }}
//           >
//             {msg.text}
//           </div>
//         </div>
//       );
//     });

//   return (
//     <>
//       {/* Floating Button */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="position-fixed bottom-4 end-4 btn rounded-circle shadow-lg d-flex align-items-center justify-content-center"
//         style={{
//           width: "64px",
//           height: "64px",
//           background: isOpen
//             ? "linear-gradient(135deg, #ef4444, #dc2626)"
//             : "linear-gradient(135deg, #2563eb, #1e40af)",
//           color: "white",
//         }}
//       >
//         {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
//       </button>

//       {isOpen && (
//         <div
//           className="position-fixed bottom-5 end-5 shadow-lg rounded-4 border p-3"
//           style={{
//             width: "380px",
//             height: "520px",
//             background: "rgba(255,255,255,0.98)",
//             display: "flex",
//             flexDirection: "column",
//             zIndex: 1050,
//           }}
//         >
//           <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
//             <h6 className="fw-bold mb-0 text-primary">Health Assistant 🤖</h6>
//             <button
//               onClick={() => setIsOpen(false)}
//               className="btn btn-sm btn-light rounded-circle"
//             >
//               <X size={16} />
//             </button>
//           </div>

//           <div className="overflow-auto flex-grow-1 pe-1">
//             {renderMessages()}
//             <div ref={chatEndRef} />
//           </div>

//           <div className="d-flex align-items-center mt-2">
//             <input
//               type="text"
//               className="form-control rounded-start-pill shadow-sm"
//               placeholder="Type your message..."
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
//             />
//             <button
//               className="btn rounded-end-pill px-3"
//               style={{
//                 background: "linear-gradient(135deg, #2563eb, #1e40af)",
//                 color: "white",
//               }}
//               onClick={() => sendMessage(input)}
//             >
//               <Send size={18} />
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default PatientChatbot;
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  MessageCircle,
  Send,
  X,
  Calendar,
  Clock,
  Edit3,
  Mail,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const PatientChatbot = ({ patientID, hospitalID }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hey 👋! Type 'hi' to begin or choose an option below." },
  ]);
  const [input, setInput] = useState("");
  const [chatState, setChatState] = useState("idle");
  const [tempBooking, setTempBooking] = useState({
    hospitalId: "",
    patientId: "",
    doctorId: "",
    doctorName: "",
    date: "",
    time: "",
    reason: "",
    email: "",
  });

  const chatEndRef = useRef(null);
  const webhookUrl = "http://localhost:5678/webhook/chatbot";

  // ✅ Keep hospitalID and patientID synced
  useEffect(() => {
    if (hospitalID || patientID) {
      setTempBooking((prev) => ({
        ...prev,
        hospitalId: hospitalID || prev.hospitalId,
        patientId: patientID || prev.patientId,
      }));
    }
  }, [hospitalID, patientID]);

  // 🔄 Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 💬 Send message logic
  const sendMessage = async (msg) => {
    if (!msg.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text: msg }]);
    setInput("");

    // 🩺 Doctor selected
    if (msg.startsWith("doctor:")) {
      const [_, id, name] = msg.split(":");
      setTempBooking((prev) => ({ ...prev, doctorId: id, doctorName: name }));

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: `You selected Dr. ${name} 🩺` },
        { from: "bot", text: "Please select your appointment date:" },
        { from: "bot", type: "date" },
      ]);
      setChatState("date");
      return;
    }

    // 📅 Date
    if (chatState === "date") {
      setTempBooking((prev) => ({ ...prev, date: msg }));
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Great! Now pick a suitable time ⏰" },
        { from: "bot", type: "time" },
      ]);
      setChatState("time");
      return;
    }

    // ⏰ Time
    if (chatState === "time") {
      setTempBooking((prev) => ({ ...prev, time: msg }));
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Got it! What’s the reason for your visit? 🩺" },
        { from: "bot", type: "reason" },
      ]);
      setChatState("reason");
      return;
    }

    // 💬 Reason
    if (chatState === "reason") {
      setTempBooking((prev) => ({ ...prev, reason: msg }));
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Please enter your email 📧 for confirmation:" },
        { from: "bot", type: "email" },
      ]);
      setChatState("email");
      return;
    }

    // 📧 Email
    if (chatState === "email") {
      const booking = { ...tempBooking, email: msg };
      setTempBooking(booking);
      setChatState("idle");

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Booking your appointment... please wait ⏳" },
      ]);

      await sendToN8n({ text: "book", booking });
      return;
    }

    // Default → send to n8n
    await sendToN8n({ text: msg });
  };

  // 🌐 Send to n8n webhook (final version)
  const sendToN8n = async (payload) => {
    try {
      const payloadToSend = {
        chatId: patientID || "guest-123",
        text: payload.text,
        booking: {
          ...payload.booking,
          hospitalId: hospitalID,
          patientId: patientID,
        },
      };

      console.log("📤 Sending to n8n:", payloadToSend);

      const res = await axios.post(webhookUrl, payloadToSend);

      let data = res.data?.body || res.data || {};
      let botReply = "";

      // Handle n8n reply safely
      if (typeof data === "string") botReply = data;
      else if (data.reply) botReply = data.reply;
      else if (data.output?.reply) botReply = data.output.reply;
      else botReply = "🤖 Sorry, I didn’t understand that.";

      botReply = botReply
        ?.toString()
        ?.replace(/^=/, "")
        ?.replace(/\\n/g, "\n")
        ?.trim();

      let options = [];
      if (Array.isArray(data.options)) options = data.options;
      else if (typeof data.options === "string") {
        try {
          options = JSON.parse(data.options);
        } catch {
          options = [];
        }
      }

      const isSuccess = botReply.includes("✅");
      const isError = botReply.includes("⚠️");

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: botReply, success: isSuccess, error: isError },
      ]);

      if (options.length > 0) {
        const formattedOptions = options.map((opt) => {
          if (opt.id && opt.name)
            return {
              text: `${opt.name} — ${opt.specialization || "General"}`,
              payload: `doctor:${opt.id}:${opt.name}`,
            };
          return opt;
        });
        setMessages((prev) => [
          ...prev,
          { from: "options", buttons: formattedOptions },
        ]);
      }
    } catch (err) {
      console.error("Chatbot Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "⚠️ Sorry, I couldn’t reach the chatbot server.",
          error: true,
        },
      ]);
    }
  };

  // 🗨️ Render messages
  const renderMessages = () =>
    messages.map((msg, idx) => {
      if (msg.type === "date")
        return (
          <div key={idx} className="mb-3 d-flex justify-content-start">
            <div className="p-3 rounded-4 bg-light shadow-sm w-100">
              <label className="fw-semibold mb-1 d-flex align-items-center gap-2">
                <Calendar size={16} /> Choose Date:
              </label>
              <input
                type="date"
                className="form-control"
                onChange={(e) => sendMessage(e.target.value)}
              />
            </div>
          </div>
        );

      if (msg.type === "time")
        return (
          <div key={idx} className="mb-3 d-flex justify-content-start">
            <div className="p-3 rounded-4 bg-light shadow-sm w-100">
              <label className="fw-semibold mb-1 d-flex align-items-center gap-2">
                <Clock size={16} /> Select Time:
              </label>
              <input
                type="time"
                className="form-control"
                onChange={(e) => sendMessage(e.target.value)}
              />
            </div>
          </div>
        );

      if (msg.type === "reason")
        return (
          <div key={idx} className="mb-3 d-flex justify-content-start">
            <div className="p-3 rounded-4 bg-light shadow-sm w-100">
              <label className="fw-semibold mb-1 d-flex align-items-center gap-2">
                <Edit3 size={16} /> Reason for Visit:
              </label>
              <input
                type="text"
                placeholder="e.g., fever, check-up"
                className="form-control"
                onKeyDown={(e) =>
                  e.key === "Enter" && sendMessage(e.target.value)
                }
              />
            </div>
          </div>
        );

      if (msg.type === "email")
        return (
          <div key={idx} className="mb-3 d-flex justify-content-start">
            <div className="p-3 rounded-4 bg-light shadow-sm w-100">
              <label className="fw-semibold mb-1 d-flex align-items-center gap-2">
                <Mail size={16} /> Email Address:
              </label>
              <input
                type="email"
                placeholder="yourname@example.com"
                className="form-control"
                onKeyDown={(e) =>
                  e.key === "Enter" && sendMessage(e.target.value)
                }
              />
            </div>
          </div>
        );

      if (msg.from === "options")
        return (
          <div
            key={idx}
            className="d-flex flex-wrap gap-2 mt-3 mb-2 justify-content-start"
          >
            {msg.buttons.map((b, i) => (
              <button
                key={i}
                className="btn btn-sm btn-outline-primary px-3 rounded-pill shadow-sm"
                onClick={() => sendMessage(b.payload || b.text || b)}
              >
                {b.text || b.payload || b}
              </button>
            ))}
          </div>
        );

      // 🧩 Normal message
      return (
        <div
          key={idx}
          className={`d-flex mb-3 ${
            msg.from === "user" ? "justify-content-end" : "justify-content-start"
          }`}
        >
          <div
            className={`p-3 rounded-4 ${
              msg.success
                ? "bg-success text-white"
                : msg.error
                ? "bg-danger text-white"
                : msg.from === "user"
                ? "bg-primary text-white"
                : "bg-light text-dark"
            }`}
            style={{ maxWidth: "75%", whiteSpace: "pre-line" }}
          >
            {msg.success && <CheckCircle size={16} className="me-2" />}
            {msg.error && <AlertTriangle size={16} className="me-2" />}
            {msg.text}
          </div>
        </div>
      );
    });

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="position-fixed bottom-4 end-4 btn rounded-circle shadow-lg d-flex align-items-center justify-content-center"
        style={{
          width: "64px",
          height: "64px",
          background: isOpen
            ? "linear-gradient(135deg, #ef4444, #dc2626)"
            : "linear-gradient(135deg, #2563eb, #1e40af)",
          color: "white",
        }}
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="position-fixed bottom-5 end-5 shadow-lg rounded-4 border p-3"
          style={{
            width: "380px",
            height: "520px",
            background: "rgba(255,255,255,0.98)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1050,
          }}
        >
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <h6 className="fw-bold mb-0 text-primary">Health Assistant 🤖</h6>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-sm btn-light rounded-circle"
            >
              <X size={16} />
            </button>
          </div>

          <div className="overflow-auto flex-grow-1 pe-1">
            {renderMessages()}
            <div ref={chatEndRef} />
          </div>

          <div className="d-flex align-items-center mt-2">
            <input
              type="text"
              className="form-control rounded-start-pill shadow-sm"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            />
            <button
              className="btn rounded-end-pill px-3"
              style={{
                background: "linear-gradient(135deg, #2563eb, #1e40af)",
                color: "white",
              }}
              onClick={() => sendMessage(input)}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientChatbot;

