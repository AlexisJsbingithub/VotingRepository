import React, { Component } from "react";
import VotingContract from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import notVoter from "./images/NotVoter.png";
import registeringVoters from "./images/RegisteringVoters.png";
import registeringProposals from "./images/RegisteringProposals.png";
import votingSession from "./images/VotingSession.png";
import findWinningProposal from "./images/WinningProposal.png";

import 'bootstrap/dist/css/bootstrap.min.css';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';

import BlockListFindVoter from "./BlockListFindVoter.js";

import "./AppVoting.css";

class AppVoting extends Component {
  state = {web3: null, accounts: null, contract: null, owner: null, voter:null, workflowStatus: null, listVoters: null, listProposals: null, proposalsDescription: null, listVotes: null, winningProposalID: null};

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
    
      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = VotingContract.networks[networkId];
      const instance = new web3.eth.Contract(
        VotingContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      const owner = await instance.methods.owner().call();

      // Set web3, accounts, and contract to the state, and then proceed with an example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance, owner: owner}, this.runInit);

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(`Failed to load web3, accounts, contract or there is no administrator. Check console for details.`);
    }
  };


  //Init administrator to be a voter
  runInit = async () => {
    const { accounts, contract, owner} = this.state;

    //Events
    const options = {
        fromBlock: 0,
        toBlock: 'latest'
    };
    const listVoters = await contract.getPastEvents("VoterRegistered", options);
    const listProposals = await contract.getPastEvents("ProposalRegistered", options);
    const listVotes = await contract.getPastEvents("Voted", options);


    let voter = await contract.methods.getVoter(accounts[0]).call({from : accounts[0]}).catch(error => null);;

    //Init owner as a voter
    if(voter==null && accounts[0]==owner)
    {
      voter = await this.state.contract.methods.addVoter(accounts[0]).send({from : owner});
    }

    const workflowStatus = await contract.methods.workflowStatus().call({from: owner});

    //Mise à jour du tableau des proposals
    const proposalsDescription =[];
    if(listProposals!=null)
    {
      const idTemp = await listProposals.length;
      for(let i=0;i<idTemp;i++)
      {
        const proposal = await contract.methods.getOneProposal(i).call({from : accounts[0]});
        proposalsDescription.push(proposal.description);
      }
    }

    const winningProposalID = await contract.methods.winningProposalID().call({from : accounts[0]});


    this.setState({voter: voter, workflowStatus: workflowStatus, listVoters: listVoters, listProposals: listProposals, proposalsDescription: proposalsDescription, listVotes: listVotes, winningProposalID: winningProposalID});
  };


  //Addition of the voter
  addVoter = async () => {
    const {accounts, contract } = this.state;
    const addressValue = this.address.value;

    if(addressValue.length != 42 || addressValue.indexOf('0x')!=0) {
      this.address.value="";
      return alert("The address format must start with '0x' and must be 42 characters long.");
    }
    else{
      try {
      await contract.methods.addVoter(addressValue).send({from : accounts[0]});
      } catch
       (error) {
        await contract.methods.addVoter(addressValue).call({from : accounts[0]}).catch(revertReason => ((revertReason.toString().indexOf("Already registered")>=0)? alert("Address already registered"):
        console.log(error)));
      };
    }
    this.address.value="";
    this.runInit();
  }


  //Addition of the proposals
  addProposal = async () => {
    const { accounts, contract } = this.state;
    const proposalValue = this.proposal.value;
    
    try {
    await contract.methods.addProposal(proposalValue).send({from : accounts[0]});
    } catch
      (error) {
      await contract.methods.addProposal(proposalValue).call({from : accounts[0]}).catch(revertReason => ((revertReason.toString().indexOf("Vous ne pouvez pas ne rien proposer")>=0)? alert("You can't not propose anything"):
      console.log(error)));
    };
    this.proposal.value="";
    this.runInit();
  }


  //Voting proposal Proposal not found
  setVote = async () => {
    const {accounts, contract} = this.state;
    const voteValue = this.vote.value;
    
    if(voteValue=='' || isNaN(voteValue))
      return alert("Proposal not found because is not a number.");
    else
    {
      try {
      await contract.methods.setVote(voteValue).send({from : accounts[0]});
      } catch
        (error) {
        await contract.methods.setVote(voteValue).call({from : accounts[0]}).catch(revertReason => ((revertReason.toString().indexOf("Proposal not found")>=0)? alert("Proposal not found"):
        console.log(error)));
      };
    };
    this.vote.value="";
    this.runInit();
  }


  //Finish registering voter and start voting
  startProposals = async () => {
    const {contract, accounts} = this.state;

    try {
      await contract.methods.startProposalsRegistering().send({from: accounts[0]});
    } catch (error) {
        console.log(error);
    };
    this.runInit();
  }

  //Finish proposals and start voting
  endProposalsStartVoting = async () => {
    const {contract, accounts} = this.state;

    try {
      await contract.methods.endProposalsRegistering().send({from: accounts[0]});
      await contract.methods.startVotingSession().send({from: accounts[0]});
    } catch (error) {
        console.log(error);
    };
    this.runInit();
  }

  //End voting
  endProposalsVoting = async () => {
    const {contract, accounts} = this.state;

    try {
      await contract.methods.endVotingSession().send({from: accounts[0]});
    } catch (error) {
        console.log(error);
    };
    this.runInit();
  }


  //End voting
  tallyVotes = async () => {
    const {contract, accounts} = this.state;

    try {
      await contract.methods.tallyVotes().send({from: accounts[0]});
    } catch (error) {
        console.log(error);
    };
    this.runInit();
  }


  render() {

    //Voter registration area
    const blockRegisterVoters =
    (
      <div className="test">
        <button onClick={this.startProposals}>Start registration of proposals</button>
        <br></br>
        <Table striped bordered hover>
          <tbody>
            <tr>
              <td align="right"><input type="text" id="address" ref={(input) => {this.address = input}}/></td>
              <td align="left"><button onClick={this.addVoter}>Register a voter</button>
              </td>
            </tr>
            <tr></tr>
          </tbody>
        </Table>
      </div>
    );

    //Next WorkFlow Status
    const blockEndProposalsStartVoting =
    (
      <div className="test">
        <button onClick={this.endProposalsStartVoting}>Finalise proposals and start voting</button>
      </div>
    );

    //Proposal registration area
    const blockRegisterProposals =
    (
      <div align="center" className="test">
        <Table striped bordered hover>
          <tbody>
            <tr>
              <td align="right"><input type="text" id="proposal" ref={(input) => {this.proposal = input}}/></td>
              <td align="left"><button onClick={this.addProposal}>Enregistrer une proposition</button>
              </td>
            </tr>
            <tr></tr>
          </tbody>
        </Table>
        <Card style={{ width: '50rem' }}>
          <Card.Header><strong>LIST OF PROPOSALS</strong></Card.Header>
          <Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Table striped bordered hover>
                  <thead><tr><td align="middle">ID proposal</td><td align="middle">Proposal description</td></tr></thead>
                  <tbody>
                    {
                      (this.state.listProposals!=null)?this.state.listProposals.map((a) => (<tr><td align="center">{a.returnValues._proposalId}</td><td>{this.state.proposalsDescription[a.returnValues._proposalId]}</td></tr>)):""
                    }
                  </tbody>
                </Table>
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      </div>
    );

    //Proposal voting area
    const blockVotingProposal =
    (
      <div align="center" className="test">
        <Table striped bordered hover>
          <tbody>
            {(this.state.voter != null && this.state.voter.hasVoted)?this.state.listVotes.map((a) => ((a.returnValues._voter==this.state.accounts[0])?(<tr><td align="right">You voted for the proposal : </td><td>{a.returnValues._proposalId} "{this.state.proposalsDescription[a.returnValues._proposalId]}"</td></tr>):"")):""}{(this.state.voter != null && !this.state.voter.hasVoted)?<tr><td align="right"><input type="text" id="vote" ref={(input) => {this.vote = input}}/></td><td align="left"><button onClick={this.setVote}>Voting for a proposal</button></td></tr>:""}
            <tr></tr>
          </tbody>
        </Table>
        <Card style={{ width: '50rem' }}>
          <Card.Header><strong>LIST OF PROPOSALS</strong></Card.Header>
          <Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Table striped bordered hover>
                  <thead><tr><td align="middle">ID proposal</td><td align="middle">Proposal description</td></tr></thead>
                  <tbody>
                    {(this.state.listProposals!=null)?this.state.listProposals.map((a) => (<tr><td align="center">{a.returnValues._proposalId}</td><td>{this.state.proposalsDescription[a.returnValues._proposalId]}</td></tr>)):""}
                  </tbody>
                </Table>
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      </div>
    );

    //Next WorkFlow Status
    const blockEndVoting =
    (
      <div className="test">
        <button onClick={this.endProposalsVoting}>Completing the votes</button>
      </div>
    );

    //Next WorkFlow Status
    const blockTallyVotes =
    (
      <div className="test">
        <button onClick={this.tallyVotes}>Finding the winner</button>
      </div>
    );

    //Print winning proposal
    const printWinningProposal =
    (
      <strong>Winning Proposal is {this.state.winningProposalID} "{(this.state.proposalsDescription!=null )?this.state.proposalsDescription[this.state.winningProposalID]:""}"<br></br>and you {(this.state.voter!=null && this.state.voter.votedProposalId==this.state.winningProposalID)?"voted":"did not vote"} for.</strong>
    );


    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    return (
      <div className="AppVoting">

        {/*HEADER AREA OF THE CURRENT USER*/}
        <div className="AppVoting-Header">
          <div>Your address is : {this.state.accounts}</div>
          <div>{(this.state.listVoters==null || this.state.listVoters.length==0)?"The adminsitrator need to accept to be a voter.":(this.state.accounts[0] == this.state.owner)?"You are the administrator.":"You are not the administrator."} </div>
          <div>{(this.state.voter !== null && this.state.voter.isRegistered)?"You are":"You are not"} a Voter.</div>
        </div>

        {/*WORKFLOW STATUS AREA*/}
        <div className="AppVoting-WorkflowStatus">
          <div className="AppVoting-WorkflowStatus-1">
          {
            // If is the administrator
            (this.state.accounts[0] == this.state.owner)?
            (
              (this.state.listVoters == null || this.state.listVoters.length == 0)?
              <img className="imgNotVoter" src={notVoter}/>
              :
              (this.state.workflowStatus == 0)?
                <img className="imgStatus" src={registeringVoters}/>
                :
                (this.state.workflowStatus == 1)?
                  <img className="imgStatus" src={registeringProposals}/>
                  :
                  (this.state.workflowStatus == 2)?
                    <img className="imgStatus" src={votingSession}/>
                    :
                    (this.state.workflowStatus == 3)?
                      <img className="imgStatus" src={votingSession}/>
                      :
                      (this.state.workflowStatus == 4)?
                        <img className="imgStatus" src={findWinningProposal}/>
                        :
                        (this.state.workflowStatus == 5)?
                          printWinningProposal
                          :
                          ""
            )
            :
            // If is another addresse
            (
              (this.state.listVoters == null || this.state.listVoters.length == 0)?
                <img className="imgNotVoter" src={notVoter}/>
                :
                (this.state.voter != null && this.state.voter.isRegistered)?
                  (this.state.workflowStatus == 0)?
                    <img className="imgStatus" src={registeringVoters}/>
                    :
                    (this.state.workflowStatus == 1)?
                      <img className="imgStatus" src={registeringProposals}/>
                      :
                      (this.state.workflowStatus == 2)?
                        <img className="imgStatus" src={votingSession}/>
                        :
                        (this.state.workflowStatus == 3)?
                          <img className="imgStatus" src={votingSession}/>
                          :
                          (this.state.workflowStatus == 4)?
                            <img className="imgStatus" src={findWinningProposal}/>
                            :
                            (this.state.workflowStatus == 5)?
                              printWinningProposal
                              :
                              ""
                  :
                  <img className="imgNotVoter" src={notVoter}/>
            )
          }
          </div>
        </div>
        <br></br>

        {/*BUTTON AREA TO GO TO NEXT STATUS*/}
        {
          // If is the administrator
          (this.state.accounts[0] == this.state.owner)?
          (
            (this.state.listVoters == null || this.state.listVoters.length == 0)?
            "The application cannot start until you are registered as a voter."
            :
            (this.state.workflowStatus == 0)?
              blockRegisterVoters
              :
              (this.state.workflowStatus == 1)?
                blockEndProposalsStartVoting
                :
                (this.state.workflowStatus == 3)?
                  blockEndVoting
                  :
                  (this.state.workflowStatus == 4)?
                    blockTallyVotes
                    :
                    ""
          )
          :
          // If is another address
          (
            (this.state.listVoters == null || this.state.listVoters.length == 0)?
              "The application cannot start until the administrator is registered as a voter."
              :
              (this.state.voter != null && this.state.voter.isRegistered)?
                (this.state.workflowStatus == 0)?
                  "Please wait for the opening of the proposals."
                  :
                  (this.state.workflowStatus == 4)?
                    "The winning proposal is under search"
                    :
                    ""
                  
                :
                "The administrator has not registered you as a voter."
          )
        }
        <br></br>

        {/*COMMON DISPLAY AREA FOR THE ADMINISTRATOR AND THE VOTERS*/}
        {
          // If is the administrator
          (this.state.accounts[0] == this.state.owner)?
          (
            (this.state.listVoters == null || this.state.listVoters.length == 0)?
              ""
              :
              (this.state.workflowStatus == 0)?
                <BlockListFindVoter listVoters={this.state.listVoters} />
                :
                (this.state.workflowStatus == 1)?
                  blockRegisterProposals
                  :
                  (this.state.workflowStatus == 3)?
                    blockVotingProposal
                    :
                    ""
          )
          :
          // If the address is not the administrator
          (
            (this.state.listVoters == null || this.state.listVoters.length == 0)?
              ""
              :
              (this.state.voter !== null && this.state.voter.isRegistered)?
                (this.state.workflowStatus == 1)?
                  blockRegisterProposals
                  :
                  (this.state.workflowStatus == 3)?
                    blockVotingProposal
                    :
                    ""
                :
                ""
          )
        }
      </div>
    );
  }
}

export default AppVoting;
