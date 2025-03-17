// Determine backend URL dynamically
let backend_url;
let backend_url_websocket;

// Function to determine if we're running locally or on production
function setupEndpoints() {
  // Check if we're running on localhost
  const isLocalhost = window.location.hostname === "localhost" || 
                      window.location.hostname === "127.0.0.1";
  
  if (isLocalhost) {
    // Local development settings
    backend_url = "http://127.0.0.1:8000";
    backend_url_websocket = "ws://127.0.0.1:8000";
  } else {
    // Production settings (EC2)
    const protocol = window.location.protocol;
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // This will be the EC2 IP or domain
    
    backend_url = `${protocol}//${host}`;
    backend_url_websocket = `${wsProtocol}//${host}`;
  }
  
  console.log("Backend URL set to:", backend_url);
  console.log("WebSocket URL set to:", backend_url_websocket);
}

// Run the setup function immediately
setupEndpoints();

function togglePopup() {
  var popup = document.getElementById("chat-container");
  let chat = document.getElementById("chat-container");

  if (chat.classList.contains("resized")) {
    chat.classList.remove("resized");
  }

  if (popup.classList.contains("show")) {
    popup.classList.remove("show");
    setTimeout(() => (popup.style.display = "none"), 300);
  } else {
    popup.style.display = "flex";
    setTimeout(() => popup.classList.add("show"), 10);
  }
}

// Check if Speech Recognition is available
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert(
    "Your browser does not support Speech Recognition. Try using Google Chrome."
  );
} else {
  const recognition = new SpeechRecognition();
  recognition.continuous = false; // Keeps listening
  recognition.interimResults = false; // Shows partial results
  recognition.lang = "en-US"; // Set language

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    output.value = output.value + transcript + " ";
    sendMessage();
  };

  recognition.onspeechend = function () {
    document.getElementById("voiceInput").style.display = "flex";
    document.getElementById("voiceBars").style.display = "none";
    setTimeout(() => {
      recognition.stop();
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }, 1500); // Stops recording after 2.5 seconds of silence
  };

  recognition.onerror = function (event) {
    console.error("Speech recognition error:", event.error);
    alert("Error with speech recognition: " + event.error);
  };

  const output = document.getElementById("userInput");
  const toggle = document.getElementById("voiceInput");
  const toggle2 = document.getElementById("voiceBars");
  let mediaStream;

  // Function to ask for microphone permission
  async function requestMicrophonePermission() {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted.");
    } catch (error) {
      console.error("Microphone permission denied:", error);
      alert("Microphone access is required for speech recognition.");
    }
  }

  // Start Listening
  toggle.addEventListener("click", async () => {
    await requestMicrophonePermission(); // Ask for permission
    document.getElementById("voiceInput").style.display = "none";
    document.getElementById("voiceBars").style.display = "flex";
    recognition.start();
  });

  // Stop Listening
  toggle2.addEventListener("click", () => {
    document.getElementById("voiceInput").style.display = "flex";
    document.getElementById("voiceBars").style.display = "none";
    recognition.stop();
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  });
}

/*

Used for to make audio files and can be edited to make real-time speech recognition.


let mediaRecorder;
let audioChunks = [];
let mediaStream;
let audioUrl = "";

async function audioInput() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return;
  }

  try {
    // Request microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Microphone permission granted!");

    console.log(mediaStream);

    // Check the permission status after requesting
    const permissionStatus = await navigator.permissions.query({
      name: "microphone",
    });
    console.log("Permission state:", permissionStatus.state);

    startRecording(mediaStream);
  } catch (error) {
    console.error("Microphone permission denied or an error occurred:", error);
  }
}

function startRecording(stream) {
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    const reader = new FileReader();
    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    reader.readAsDataURL(audioBlob);
    reader.onloadend = function () {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = reader.result;
      document.body.appendChild(audio);
      console.log(reader.result);
      audioUrl = reader.result;
    };

    // Create an audio element to play the recording

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  };

  mediaRecorder.start();
  console.log("Recording started...");
}

*/

//file handling

document
  .getElementById("actual-btn-file")
  .addEventListener("change", function (event) {
    const file = event.target.files[0]; // Get the uploaded file

    if (file) {
      if (file.type.startsWith("image/")) {
        // Ensure it's an image
        const reader = new FileReader(); // Convert file to Base64 URL
        reader.readAsDataURL(file);
        reader.onload = function () {
          // processImage(reader.result);
        };
        showfile(file.name, URL.createObjectURL(file));
      } else {
        alert("Please upload a valid image file.");
      }
    } else {
      alert("Please upload a image file.");
    }
  });

function showfile(filename, fileUrl) {
  let fileElement = document.getElementById("fileElement");
  let chatbox = document.getElementById("chatbox");
  let textArea = document.getElementById("userInput");
  fileElement.classList.add("show");
  fileElement.innerHTML += `<div class="fileElementName" id="fileElementName">${filename}</div>`;
  fileElement.onclick = function () {
    window.open(fileUrl, "_blank");
  };
  chatbox.style.marginBottom = 15 + textArea.scrollHeight + 40 + "px";

  document.getElementsByClassName("fileButtons")[0].classList.toggle("show");
}

function chatIconPreviewImage(url = "") {
  let userMessage = document.getElementById("userInput").value;
  let file = document.getElementById("actual-btn-file").files[0];

  if (url == "") {
    let reader = new FileReader();
    reader.onload = function (e) {
      let img = document.createElement("img");
      img.setAttribute("class", "input-image");
      img.src = e.target.result;
      img.onload = function () {
        chatbox.appendChild(img);
        addUserMessage(userMessage); // Append the image preview first
      };
    };
    reader.readAsDataURL(file);
  } else {
    let img = document.createElement("img");
    img.setAttribute("class", "input-image");
    img.src = url;
    img.alt = "Image";
    chatbox.appendChild(img);
    addUserMessage(userMessage);
  }

  scrollToBottom();
}

function addUserMessage(userMessage) {
  const chatbox = document.getElementById("chatbox");

  const messageDiv = document.createElement("p");
  messageDiv.classList.add("user-message");
  messageDiv.textContent = userMessage;
  chatbox.appendChild(messageDiv);
  

  showTypingIndicator();
  scrollToBottom();
}

function showTypingIndicator() {
  let typingIndicator = document.createElement("div");
  typingIndicator.classList.add("bot-message", "typing-indicator");
  typingIndicator.innerHTML = `<span>...</span>`;
  chatbox.appendChild(typingIndicator);
  scrollToBottom(); // Keep it in view
}

function removeTypingIndicator() {
  document.querySelectorAll(".typing-indicator").forEach((div) => div.remove());
}

let cancelTask = false;

async function sendMessage() {
  let userMessage = document.getElementById("userInput").value;
  let chatbox = document.getElementById("chatbox");
  let file = document.getElementById("actual-btn-file").files[0];

  cancelTask = false;

  if (userMessage.trim().length != 0) {

    if (document.getElementById("actual-btn-file").files.length) {
      chatIconPreviewImage();
      fileUpload(userMessage, chatbox, file);
    } else if (externalFileUrl != "") {
      chatIconPreviewImage(externalFileUrl);
      externalFileResponse(userMessage, chatbox, externalFileUrl);
      externalFileUrl = "";
    } else {
      addUserMessage(userMessage);
      textResponse(userMessage, chatbox);
    }

    resetAfterSend();

    scrollToBottom(); // Ensure the chat remains at the bottom
  }
}

async function textResponse(userMessage, chatbox) {
  try {
    const socket = new WebSocket(`${backend_url_websocket}/chat`);

    socket.onopen = () => {
      // Send user message after connection opens
      const messageData = { message: userMessage, file: [], code: botCode };
      socket.send(JSON.stringify(messageData));
    };

    // Create an empty message container for bot response
    let botMessageDiv = document.createElement("p");
    botMessageDiv.classList.add("bot-message");
    chatbox.appendChild(botMessageDiv);
    botMessageDiv.style.display = "none";

    let messageQueue = [];
    let isTyping = false;
    let autoScroll = true;

    chatbox.addEventListener("scroll", () => {
      const isAtBottom =
        chatbox.scrollHeight - chatbox.scrollTop <= chatbox.clientHeight + 10;
      autoScroll = isAtBottom;
    });

    const observer = new MutationObserver(() => {
      if (autoScroll) {
        chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: "smooth" });
      }
    });

    observer.observe(chatbox, { childList: true, subtree: true });

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.answer) {
          messageQueue.push(data.answer);
          processQueue();
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    

    function processQueue() {
      if (isTyping || messageQueue.length === 0) {
        if (!isTyping && messageQueue.length === 0) {
          botMessageDiv.innerHTML = marked.parse(botMessageDiv.innerHTML);
        }
        return;
      }
  
      isTyping = true;
  
      let answerText = messageQueue.shift();
      let index = 0;
      const speed = 10; // Adjust speed (milliseconds per character)
  
      function typeWriter() {
        if (index < answerText.length) {
          const currentChar = answerText.charAt(index);

          if (botMessageDiv.style.display === "none") {
            removeTypingIndicator();
            botMessageDiv.style.display = "unset";
            botMessage = document.createElement("p");
            botMessageDiv.appendChild(botMessage);
          }

          if (currentChar === "\n") {
            // Parse existing content before creating a new div
            botMessage.innerHTML = marked.parse(
              botMessage.innerHTML
            );
            botMessage.innerHTML += currentChar;
            // Create a new message block for the next line
            botMessage = document.createElement("p");
            botMessageDiv.appendChild(botMessage);
          } else {
            botMessage.innerHTML += currentChar;
          }

          index++;
          setTimeout(typeWriter, speed);
        } else {
          isTyping = false;
          processQueue(); // Process the next message after completing the current one
        }
      }

    
  
      typeWriter();
    }

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      removeTypingIndicator();
      chatbox.innerHTML += `<div class="bot-message error">Error receiving response.</div>`;
    };

    socket.onclose = () => {
      console.log("WebSocket closed.");
      removeTypingIndicator();
    };
  } catch (error) {
    removeTypingIndicator();
    chatbox.innerHTML += `<div class="bot-message error">Error connecting to server.</div>`;
  }
  
}

async function fileUpload(userMessage, chatbox, file) {
  const form = new FormData();
  form.append("file", file);
  form.append("code", botCode);

  try {
    const uploadResponse = await fetch(`${backend_url}/upload`, {
      method: "POST",
      body: form,
    });

    const uploadData = await uploadResponse.json();

    console.log(uploadData.id);

    fileResponse(userMessage, chatbox, uploadData.id);
  } catch (error) {
    removeTypingIndicator();
    if (!cancelTask) {
      chatbox.innerHTML += `<div class="bot-message error">Upload failed!</div>`;
    }
  }
}

async function fileResponse(userMessage, chatbox, id) {
  try {
    // Create a new WebSocket connection to your endpoint.
    const ws = new WebSocket(`${backend_url_websocket}/filechat`);


    // When the WebSocket connection opens, send the initial JSON payload.
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          query: userMessage,
          files: [
            {
              type: "image",
              transfer_method: "local_file",
              upload_file_id: id,
            },
          ],
          code: botCode, // Ensure botCode is defined in your scope
        })
      );
    };


    
    let botMessageDiv = document.createElement("p");
    botMessageDiv.classList.add("bot-message");
    chatbox.appendChild(botMessageDiv);
    botMessageDiv.style.display = "none";

    let messageQueue = [];
    let isTyping = false;
    let autoScroll = true;

    chatbox.addEventListener("scroll", () => {
      const isAtBottom =
        chatbox.scrollHeight - chatbox.scrollTop <= chatbox.clientHeight + 10;
      autoScroll = isAtBottom;
    });

    const observer = new MutationObserver(() => {
      if (autoScroll) {
        chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: "smooth" });
      }
    });

    observer.observe(chatbox, { childList: true, subtree: true });


    // Listen for messages from the server.
    ws.onmessage = (event) => {
      removeTypingIndicator();
      try {
        const data = JSON.parse(event.data);

        if (data.answer) {
          messageQueue.push(data.answer);
          processQueue();
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    function processQueue() {
      if (isTyping || messageQueue.length === 0) {
        if (!isTyping && messageQueue.length === 0) {
          botMessageDiv.innerHTML = marked.parse(botMessageDiv.innerHTML);
        }
        return;
      }
  
      isTyping = true;
  
      let answerText = messageQueue.shift();
      let index = 0;
      const speed = 10; // Adjust speed (milliseconds per character)
  
      function typeWriter() {
        if (index < answerText.length) {
          const currentChar = answerText.charAt(index);

          if (botMessageDiv.style.display === "none") {
            removeTypingIndicator();
            botMessageDiv.style.display = "unset";
            botMessage = document.createElement("p");
            botMessageDiv.appendChild(botMessage);
          }

          if (currentChar === "\n") {
            // Parse existing content before creating a new div
            botMessage.innerHTML = marked.parse(
              botMessage.innerHTML
            );
            botMessage.innerHTML += currentChar;
            // Create a new message block for the next line
            botMessage = document.createElement("p");
            botMessageDiv.appendChild(botMessage);
          } else {
            botMessage.innerHTML += currentChar;
          }

          index++;
          setTimeout(typeWriter, speed);
        } else {
          isTyping = false;
          processQueue(); // Process the next message after completing the current one
        }
      }

    
  
      typeWriter();
    }


    // Handle any errors.
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      removeTypingIndicator();
      if (!cancelTask) {
        chatbox.innerHTML += `<div class="bot-message error">Error connecting to server.</div>`;
        
      }
    };

    // When the WebSocket closes, remove the typing indicator.
    ws.onclose = () => {
      removeTypingIndicator();
    };
  } catch (error) {
    removeTypingIndicator();
    if (!cancelTask) {
      chatbox.innerHTML += `<div class="bot-message error">Error connecting to server.</div>`;
      
    }
  }
  
}

async function externalFileResponse(userMessage, chatbox, Url) {
  try {
    // Create a new WebSocket connection to your endpoint.
    const ws = new WebSocket(`${backend_url_websocket}/urlchat`);

    // When the WebSocket connection opens, send the initial JSON payload.
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          query: userMessage,
          files: [{ type: "image", transfer_method: "remote_url", url: Url }],
          code: botCode, // Ensure botCode is defined in your scope
        })
      );
    };

    let botMessageDiv = document.createElement("p");
    botMessageDiv.classList.add("bot-message");
    chatbox.appendChild(botMessageDiv);
    botMessageDiv.style.display = "none";

    let messageQueue = [];
    let isTyping = false;
    let autoScroll = true;

    chatbox.addEventListener("scroll", () => {
      const isAtBottom =
        chatbox.scrollHeight - chatbox.scrollTop <= chatbox.clientHeight + 10;
      autoScroll = isAtBottom;
    });

    const observer = new MutationObserver(() => {
      if (autoScroll) {
        chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: "smooth" });
      }
    });

    observer.observe(chatbox, { childList: true, subtree: true });

    // Listen for messages from the server.
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.answer) {
          messageQueue.push(data.answer);
          processQueue();
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    function processQueue() {
      if (isTyping || messageQueue.length === 0) {
        if (!isTyping && messageQueue.length === 0) {
          botMessageDiv.innerHTML = marked.parse(botMessageDiv.innerHTML);
        }
        return;
      }
  
      isTyping = true;
  
      let answerText = messageQueue.shift();
      let index = 0;
      const speed = 10; // Adjust speed (milliseconds per character)
  
      function typeWriter() {
        if (index < answerText.length) {
          const currentChar = answerText.charAt(index);

          if (botMessageDiv.style.display === "none") {
            removeTypingIndicator();
            botMessageDiv.style.display = "unset";
            botMessage = document.createElement("p");
            botMessageDiv.appendChild(botMessage);
          }

          if (currentChar === "\n") {
            // Parse existing content before creating a new div
            botMessage.innerHTML = marked.parse(
              botMessage.innerHTML
            );
            botMessage.innerHTML += currentChar;
            // Create a new message block for the next line
            botMessage = document.createElement("p");
            botMessageDiv.appendChild(botMessage);
          } else {
            botMessage.innerHTML += currentChar;
          }

          index++;
          setTimeout(typeWriter, speed);
        } else {
          isTyping = false;
          processQueue(); // Process the next message after completing the current one
        }
      }

    
  
      typeWriter();
    }



    // Handle any errors.
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      removeTypingIndicator();
      if (!cancelTask) {
        chatbox.innerHTML += `<div class="bot-message error">Error connecting to server.</div>`;
        
      }
    };

    // When the WebSocket closes, remove the typing indicator.
    ws.onclose = () => {
      removeTypingIndicator();
    };
  } catch (error) {
    removeTypingIndicator();
    if (!cancelTask) {
      chatbox.innerHTML += `<div class="bot-message error">Error connecting to server.</div>`;
      
    }
  }
  
}

// Auto scroll to bottom function
function scrollToBottom() {
  let chatbox = document.getElementById("chatbox");
  chatbox.scrollTop = chatbox.scrollHeight;
}

function adjustHeight(element) {
  let maxH = window.getComputedStyle(element).maxHeight;

  if (parseInt(element.scrollHeight, 10) < parseInt(maxH, 10)) {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
    let fileElement = document.getElementById("fileElement");
    let chatbox = document.getElementById("chatbox");
    fileElement.style.bottom = 7 + element.scrollHeight + 5 + "px";
    if (fileElement.classList.length == 1) {
      chatbox.style.marginBottom = 15 + element.scrollHeight + 5 + "px";
    } else {
      chatbox.style.marginBottom = 15 + element.scrollHeight + 40 + "px";
    }
  }
}

async function resetVariable() {
  await fetch(`${backend_url}/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: "", code: botCode }),
  });
}

function reset() {
  resetVariable();
  document
    .querySelectorAll(
      ".user-message, .bot-message, .typing-indicator, .fileElementName, .input-image"
    )
    .forEach((div) => div.remove());

  resetAfterSend();
  document.getElementById("voiceInput").style.display = "flex";
  document.getElementById("voiceBars").style.display = "none";

  cancelTask = true;
}

function resetAfterSend() {
  document.getElementById("actual-btn-file").value = "";
  document.getElementById("fileElement").classList.remove("show");
  document.getElementById("chatbox").style.marginBottom = "94px";
  let userInput = document.getElementById("userInput");
  userInput.style.height = 54 + "px";
  document.getElementById("fileElement").style.bottom = "95px";
  document.getElementById("userInput").value = "";

  document.querySelectorAll(".fileElementName").forEach((div) => div.remove());

  document.getElementsByClassName("fileButtons")[0].classList.remove("show");

  document.getElementById("userInput").placeholder = "Message";
  document.getElementById("sendButton").style.display = "unset";
  document.getElementById("sendUrl").style.display = "none";
}

function resize() {
  document.getElementById("chat-container").classList.toggle("resized");
  document.getElementById("userInput").classList.toggle("resized");
}

function inputsToggle() {
  document.getElementsByClassName("fileButtons")[0].classList.toggle("show");
}

function fileUrlEnter() {
  document.getElementById("userInput").placeholder = "Enter your URL here";
  document.getElementById("sendButton").style.display = "none";
  document.getElementById("sendUrl").style.display = "unset";
}

let externalFileUrl = "";

function sendUrl() {
  let url = document.getElementById("userInput").value;
  externalFileUrl = url;
  let urlName = url;
  if (url.length > 10) {
    urlName = url.slice(0, 10) + "....";
  }
  showfile(urlName, url);

  let userInput = document.getElementById("userInput");
  userInput.style.height = 54 + "px";
  document.getElementById("fileElement").style.bottom = "95px";
  document.getElementById("userInput").value = "";

  document.getElementsByClassName("fileButtons")[0].classList.remove("show");

  document.getElementById("userInput").placeholder = "Message";
  document.getElementById("sendButton").style.display = "unset";
  document.getElementById("sendUrl").style.display = "none";
}

// for to send message when enter is pressed and goes to new line when shift + enter is pressed
document.addEventListener("DOMContentLoaded", function () {
  let input = document.getElementById("userInput");

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      if (event.shiftKey) {
        event.preventDefault();
        const cursorPos = input.selectionStart;
        input.value =
          input.value.substring(0, cursorPos) +
          "\n" +
          input.value.substring(cursorPos);
        input.selectionStart = input.selectionEnd = cursorPos + 1;
      } else {
        event.preventDefault();
        if (document.getElementById("sendButton").style.display === "none") {
          sendUrl();
        } else {
          sendMessage();
        }
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const imageContainer = document.getElementById("botIcon");
  const botButton = document.getElementById("botButtonImage");
  const headerImg = document.getElementById("headerImg");

  fetch(`${backend_url}/get_chatIcon/${botCode}`)
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch image");
      return response.json();
    })
    .then(data => {
      imageContainer.src = data.image_data;
    })
    .catch(error => console.error("Error loading image:", error));

    fetch(`${backend_url}/get_botIcon/${botCode}`)
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch image");
      return response.json();
    })
    .then(data => {
      botButton.src = data.image_data;
    })
    .catch(error => console.error("Error loading image:", error));

    fetch(`${backend_url}/get_bg/${botCode}`)
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch image");
      return response.json();
    })
    .then(data => {
      document.body.style.backgroundImage = `url("${data.image_data}")`;
    })
    .catch(error => console.error("Error loading image:", error));

    fetch(`${backend_url}/header_img/${botCode}`)
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch image");
      return response.json();
    })
    .then(data => {
      headerImg.src = data.data;
    })
    .catch(error => console.error("Error loading image:", error));

    fetch(`${backend_url}/chatbox_text/${botCode}`)
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch data");
      return response.json();
    })
    .then(data => {
      document.getElementById("firstBotMessage").innerHTML = data.data;
    })
    .catch(error => console.error("Error loading image:", error));

    fetch(`${backend_url}/chat_gradient/${botCode}`)
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch data");
      return response.json();
    })
    .then(data => {
      document.getElementsByClassName("chat-container")[0].style.background = data.data;
    })
    .catch(error => console.error("Error loading image:", error));

});