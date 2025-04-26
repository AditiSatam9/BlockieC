import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  Backdrop,
  Alert,
  Container
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import { Link, Outlet } from "react-router-dom";
import { APIClient } from "openlaw";
import { ethers } from "ethers";
import ContractForm from "./components/Form";
import Preview from "./components/Preview";
import { Templates } from "./utility/templates";
import { address, abi } from "./utility/smartcontract";
import { sha256 } from "crypto-hash";
import { isValidTemplate } from "./utility/isValid";

const apiClient = new APIClient("https://lib.openlaw.io/api/v1/default");

export default function App() {
  const [template, setTemplate] = useState(Templates[0].txt);
  const [formData, setFormdata] = useState({});
  const [key, setKey] = useState(0);
  const textfieldRef = useRef();
  const [ethAddress, setEthAddress] = useState("");
  const [popup, setPopup] = useState(false);
  const [signedMsg, setSignedMsg] = useState("");
  const [fileInput, setFileInput] = useState("");
  const [hashed, setHashed] = useState();
  const [detail, setDetail] = useState();
  const [alert, setAlert] = useState(false);
  const [recipient, setRecipient] = useState("");

  useEffect(() => {
    const connectToMetamask = async () => {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setEthAddress(accounts[0]);
      }
    };
    connectToMetamask();
  }, [ethAddress]);

  const formUpdate = (key, value) => {
    setFormdata({ ...formData, [key]: value });
  };

  const handleFileInput = (e) => {
    const pdf = new FileReader();
    pdf.onload = async () => {
      const tempHash = await sha256(pdf.result);
      setHashed(tempHash);
      setFileInput(pdf.result);
    };
    pdf.readAsArrayBuffer(e.target.files[0]);
    setPopup(true);
  };

  const createContract = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const openlawContract = new ethers.Contract(address, abi, provider);
      const openlawSigner = openlawContract.connect(signer);
      const now = new Date();

      const response = await openlawSigner.create(
        recipient || "0x0000000000000000000000000000000000000000",
        now.toString(),
        " ",
        hashed,
        detail
      );

      setSignedMsg(response);
      setAlert(true);
    } else {
      alert("Please install the Metamask extension.");
    }
  };

  const submitTemplate = (e) => {
    e.preventDefault();
    setKey(key + 1);
    setFormdata({});
    setAlert(false);
    if (isValidTemplate(textfieldRef.current.value)) {
      setTemplate(textfieldRef.current.value);
    } else {
      alert("Invalid template. Use [[Field]] format.");
    }
  };

  const downloadPDF = (e) => {
    e.preventDefault();
    const pdf = {
      content: template,
      title: Templates[0].title,
      parameters: formData,
    };
    apiClient.downloadAsPdf(pdf);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, backgroundColor: "#f0f8ff" }}>
      <Box
        component="nav"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          borderBottom: 2,
          pb: 1,
          borderColor: "#00bcd4",
          color: "#00796b"
        }}
      >
        <Box>
          <Link to="/" style={{ textDecoration: "none", color: "#0288d1" }}>Home</Link> |
          <Link to="/view" style={{ textDecoration: "none", color: "#0288d1", marginLeft: "5px" }}>View Contracts</Link>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Ropsten Test Network: {address}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={6} sx={{ p: 3, backgroundColor: "#e1f5fe" }}>
            <Typography variant="h6" textAlign="center" color="#0288d1">
              Editable Template
            </Typography>
            <Button fullWidth onClick={submitTemplate} sx={{ mt: 2, backgroundColor: "#00bcd4", color: "#fff", '&:hover': { backgroundColor: "#008ba3" } }}>Generate New Template</Button>
            <TextField
              multiline
              fullWidth
              variant="standard"
              defaultValue={template}
              inputRef={textfieldRef}
              sx={{ mt: 2 }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={6} sx={{ p: 3, backgroundColor: "#e8f5e9" }}>
            <Typography variant="h6" textAlign="center" color="#43a047">Contract Form</Typography>
            <ContractForm template={template} stateLift={formUpdate} key={key} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={6} sx={{ p: 3, backgroundColor: "#fce4ec" }}>
            <Typography variant="h6" textAlign="center" color="#d81b60">Preview</Typography>
            <Button onClick={downloadPDF} sx={{ mt: 1, mb: 2, backgroundColor: "#f06292", color: "white", '&:hover': { backgroundColor: "#c2185b" } }}>Download PDF</Button>
            <Preview template={template} formData={formData} />
            <Button variant="contained" endIcon={<SendIcon />} fullWidth onClick={() => setPopup(true)} sx={{ backgroundColor: "##d81b60", '&:hover': { backgroundColor: "#5e35b1" } }}>
              Send to Blockchain
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Backdrop open={popup} sx={{ zIndex: 1201, color: "#00e676", backgroundColor: "rgba(0,0,0,0.7)" }}>
        <Paper elevation={5} sx={{ p: 4, width: "70%", textAlign: "center", backgroundColor: "#ffffff" }}>
          <CloseIcon sx={{ float: "right", cursor: "pointer", color: "#f44336" }} onClick={() => setPopup(false)} />
          <Typography variant="h6" mb={2} color="#00bcd4">Upload and Sign Contract</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Upload the contract PDF or any document to hash and store on blockchain
          </Typography>
          <TextField type="file" onChange={handleFileInput} fullWidth sx={{ mb: 3 }} />
          <TextField label="Short Description" variant="outlined" fullWidth onChange={(e) => setDetail(e.target.value)} sx={{ mb: 3 }} />
          <TextField label="Recipient Address" variant="outlined" fullWidth onChange={(e) => setRecipient(e.target.value)} sx={{ mb: 3 }} />
          <Typography variant="caption" display="block" mb={2}>
            Set your Metamask to Ropsten and ensure you have some Ether
          </Typography>
          <Button variant="contained" color="success" onClick={createContract} sx={{ backgroundColor: "#00c853", '&:hover': { backgroundColor: "#00bfa5" } }}>Sign</Button>
          {alert && <Alert sx={{ mt: 3 }} severity="success">Contract successfully deployed! View it under 'View Contracts'.</Alert>}
        </Paper>
      </Backdrop>
    </Container>
  );
}
