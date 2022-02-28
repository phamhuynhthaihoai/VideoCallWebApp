const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "1111",
});
let myVideoStream;
let currentUserId;
let pendingMsg = 0;
var currentPeer;
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        currentPeer = call.peerConnection;
      });
    });

    socket.on("user-connected", (userId) => {
      console.log("user connected.,..........");
      setTimeout(function () {
        connectToNewUser(userId, stream);
      }, 1000);
    });

    socket.on("user-disconnected", (userId) => {
      if (peers[userId]) peers[userId].close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value != "") {
        socket.emit("message", chatInputBox.value);
        chatInputBox.value = "";
      }
    });

    socket.on("createMessage", (msg) => {
      console.log(msg);
      let li = document.createElement("li");
      li.innerHTML = msg;
      all_messages.append(li);
      scrollToBottom();
    });
  });

myPeer.on("open", (id) => {
  currentUserId = id;
  socket.emit("join-room", ROOM_ID, id);
});

socket.on("disconnect", function () {
  socket.emit("leave-room", ROOM_ID, currentUserId);
  speakText(`user ${userId} leaved`);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
    currentPeer = call.peerConnection;
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

const speakText = (msgTxt) => {
  var msg = new SpeechSynthesisUtterance();
  msg.text = msgTxt;
  window.speechSynthesis.speak(msg);
};

const scrollToBottom = () => {
  var d = $(".main__chat_window");
  d.scrollTop(d.prop("scrollHeight"));
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};
const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <!--<span>Mute</span>-->
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <!--<span style="color: #eb534b;">Unmute</span>-->
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

//show khung chat
const ShowChat = (e) => {
  e.classList.toggle("active");
  document.body.classList.toggle("showChat");
};

//stop video
const playStop = () => {
  console.log("object");
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};
const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <!--<span>Stop Video</span>-->
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
  <!--<span style="color: #eb534b;">Play Video</span>-->
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

//invite
const showInvitePopup = () => {
  document.body.classList.add("showInvite");
  document.getElementById("roomLink").value = window.location.href;
};

const hideInvitePopup = () => {
  document.body.classList.remove("showInvite");
};

const copyToClipboard = () => {
  var copyText = document.getElementById("roomLink");

  copyText.select();
  copyText.setSelectionRange(0, 99999);

  document.execCommand("copy");

  // alert("Copied: " + copyText.value);

  hideInvitePopup();
};

// function closeWindow() {
//   if (confirm("Close Window?")) {
//     window.open("", "_self", "");
//     window.close();
//   }
// }

const shareScreen = (e) => {
  navigator.mediaDevices.getDisplayMedia({ 
    video: { 
      cursor: "always"
     },
     audio:{
       echoCancellation: true,
       noiseSuppression: true
     }
     }).then((stream)=>{
       let videoTrack = stream.getVideoTracks()[0];
       videoTrack.onended = function(){
         stopScreenShare();
       }
       let sender = currentPeer.getSenders().find(function(s){
          return s.track.kind == videoTrack.kind;
       })
       sender.replaceTrack(videoTrack)
     }).catch((err)=>{
       console.log("unable to get display media"+err)
     })
};

function stopScreenShare(){
  let videoTrack = myVideoStream.getVideoTracks()[0];
  var sender = currentPeer.getSenders().find(function(s){
    return s.track.kind == videoTrack.kind;
  })
  sender.replaceTrack(videoTrack)
}
