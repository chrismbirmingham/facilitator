import './App.css';
import React, { useState } from "react";
import { ReactMic } from 'react-mic';
import { w3cwebsocket as W3CWebSocket } from "websocket";
// import axios from "axios";

const stt_socket = new W3CWebSocket('ws://localhost:8000/api/stt')

const App = ({ classes }) => {
  const BOT_START = "Hi, I am your virtual personal mental health assistant. How are you doing today?"
  const [transcribedData, setTranscribedData] = useState([""]);
  // const [interimTranscribedData, ] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [beginConversation, setBeginConversation] = useState(true)
  // const [response, setResponse] = useState("");

  /////// Socket Handler ///////
  stt_socket.onopen = () => {
      console.log({ event: 'onopen' })
  };
  stt_socket.onclose = () => {
    console.log({ event: 'onclose' })
  }
  stt_socket.onerror = (error) => {
      console.log({ event: 'onerror', error })
  }
  function onData(recordedBlob) {
    stt_socket.send(recordedBlob)// console.log('chunk of real-time data is: ', recordedBlob);
  }
  stt_socket.onmessage = (message) => {
      const received = message.data
      if (received) {
          console.log(received)
          setStatus('computing')
          process_response(received)
     }
  }



  async function process_response(received) {
    setTranscribedData(oldData => [...oldData, <br></br>, received])
    const res = await get_facilitator_response(received)
    setTranscribedData(oldData => [...oldData, <br></br>,res])
    do_tts(res)
    setBeginConversation(false)
  }

  async function get_facilitator_response(e) {
    const text = e
    if (text) {
      return fetch(`//localhost:8000/api/facilitator_response?text=${encodeURIComponent(text)}&reset_conversation=${encodeURIComponent(beginConversation)}`, { cache: 'no-cache' })
      .then(response => response.text())
      .then(message => {console.log(message); return message})
    }
  }

  function do_tts(e) {
    const text = e
    const speaker_id = "p326"
    const style_wav = ""
    console.log("In tts")
    if (text) {
        fetch(`//localhost:8000/api/tts?text=${encodeURIComponent(text)}&speaker_id=${encodeURIComponent(speaker_id)}&style_wav=${encodeURIComponent(style_wav)}`, { cache: 'no-cache' })
            .then(function (res) {
                if (!res.ok) throw Error(res.statusText)
                return res.blob()
            }).then(function (blob) {
                const audioUrl = URL.createObjectURL(blob)
                const audio = new Audio(audioUrl)
                audio.play();
                setStatus('speaking')
                audio.addEventListener('ended', () => {setStatus('listening')});
            }).catch(function (err) {
            })
    }
    return false
  }

  function setStatus(newstatus)
  {
    document.getElementById("bot").className = newstatus
    if (["speaking","thinking", "computing"].includes(newstatus)) {
      setListener(false)
    } else {
      setListener(true)
    }
  }
  function setListener(newstatus)
  {
    setIsRecording(newstatus)
    var x = document.getElementById("listenbox");
    if (newstatus === true) {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  }
  function startBot() {
    setTranscribedData(BOT_START);
    do_tts(BOT_START)
  }
  return (
    <div className="App">
      <header className="App-header">
      </header>

      <div id="container">
        <div id="bot" className="neutral">
          <div id="head">
            <div id="left-ear">
              <div id="left-ear-inner"></div>
            </div>
            <div id="face">
              <div id="eyes">
                <div id="left-eye"></div>
                <div id="right-eye"></div>
              </div>
              <div id="mouth"></div>
            </div>
            <div id="right-ear">
              <div id="right-ear-inner"></div>
            </div>
          </div>
        </div>
        {/* <ul id="switches">
          <li onMouseOver={() => {setStatus('')}}> Neutral </li>
          <li onMouseOver={() => {setStatus('speaking')}}> Speaking </li> 
          <li onMouseOver={() => {setStatus('thinking')}}> Thinking </li>  
          <li onMouseOver={() => {setStatus('listening')}}> Listening </li>  
          <li onMouseOver={() => {setStatus('computing')}}> Computing </li>  
        </ul> */}
      </div>

      <div id="listenbox">
        <div id="mic">
          <ReactMic
            record={isRecording}
            onData={onData}
            sampleRate={16000}
            timeSlice={5000}
            className="sound-wave"
            strokeColor="#fff"
            backgroundColor="#000" 
            height="100"
            width="320" />
        </div>      
        <button onClick={startBot}>Click To Start Conversing With Facilitator Bot!</button>
      </div>
      <div>
        <p> {transcribedData}</p>
      </div>
    </div>
  );
}

export default App;