// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Voting contract
/// @author Cyril and Alexis
/// @notice This is a contract as part of Alyra's TP3
/// @dev There are comment codes (only visible in the source code) for possible improvements, later
contract Voting is Ownable {
    /* CODE BLOCK FOR POSSIBLE IMPROVEMENTS LATER :

    arrays for draw, uint for single
    uint[] winningProposalsID;
    Proposal[] public winningProposals;
    */

    /// ::::::::::::: DECLARATION OF STRUCT, ENUM, EVENT, MODIFIER, AND OTHER VARIABLES :::::::::::::

    /// @notice id of the winning proposal
    uint256 public winningProposalID;

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedProposalId;
    }

    struct Proposal {
        string description;
        uint256 voteCount;
    }

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /// @notice workflow status
    WorkflowStatus public workflowStatus;

    Proposal[] proposalsArray;
    mapping(address => Voter) voters;

    /// @notice event for voter registration
    /// @param _voterAddress voter's address
    event VoterRegistered(address _voterAddress);

    /// @notice event on workflow status update
    /// @param _previousStatus previous status
    /// @param _newStatus new status
    event WorkflowStatusChange(
        WorkflowStatus _previousStatus,
        WorkflowStatus _newStatus
    );

    /// @notice event on the registration of the proposal
    /// @param _proposalId id of the registered proposal
    event ProposalRegistered(uint256 _proposalId);

    /// @notice voting event
    /// @param _voter voter's address
    /// @param _proposalId id of the proposal voted
    event Voted(address _voter, uint256 _proposalId);

    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }

    //we can make a modification for the states

    /// ::::::::::::: GETTERS ::::::::::::: ///

    /// @notice Find the information of a voter
    /// @param _addr address of the voter to find
    /// @return a voter structure
    function getVoter(address _addr)
        external
        view
        onlyVoters
        returns (Voter memory)
    {
        return voters[_addr];
    }

    /// @notice Find the information of the proposal id searched
    /// @param _id id of the proposal to find
    /// @return a proposal structure
    function getOneProposal(uint256 _id)
        external
        view
        onlyVoters
        returns (Proposal memory)
    {
        return proposalsArray[_id];
    }

    /// @notice REGISTRATION OF A VOTER WITH 1 EVENT AND 1 REQUIRE
    /// @param _addr Address of the voter to be registered
    function addVoter(address _addr) external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Voters registration is not open yet"
        );
        require(voters[_addr].isRegistered != true, "Already registered");

        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }

    /* CODE BLOCK FOR POSSIBLE IMPROVEMENTS LATER :

    function deleteVoter(address _addr) external onlyOwner {
    require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
    require(voters[_addr].isRegistered == true, 'Not registered.');
    voters[_addr].isRegistered = false;
    emit VoterRegistered(_addr);
    }*/

    /// @notice REGISTRATION OF A PROPOSAL WITH 1 EVENT AND 2 REQUIRES
    /// @param _desc Description of the proposal to be registered
    function addProposal(string memory _desc) external onlyVoters {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Proposals are not allowed yet"
        );
        require(
            keccak256(abi.encode(_desc)) != keccak256(abi.encode("")),
            "Vous ne pouvez pas ne rien proposer"
        ); // Optional
        // See that desc is different from others

        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        emit ProposalRegistered(proposalsArray.length - 1);
    }

    /// @notice VOTE FOR A PROPOSAL WITH 1 EVENT AND 3 REQUIRES
    /// @param _id id of the proposal to be voted on
    function setVote(uint256 _id) external onlyVoters {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Voting session havent started yet"
        );
        require(voters[msg.sender].hasVoted != true, "You have already voted");
        require(_id < proposalsArray.length, "Proposal not found"); // pas obligé, et pas besoin du >0 car uint

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;

        //CORRECTION OF THE SECURITY BREACH
        if (
            proposalsArray[_id].voteCount >
            proposalsArray[winningProposalID].voteCount
        ) {
            winningProposalID = _id;
        }

        emit Voted(msg.sender, _id);
    }

    /// 4 FUNCTIONS FOR UPDATING THE WORKFLOW STATUS. EACH WITH 1 EVENT AND 1 REQUIRE

    /// @notice Starts the registration of proposals
    function startProposalsRegistering() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Registering proposals cant be started now"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(
            WorkflowStatus.RegisteringVoters,
            WorkflowStatus.ProposalsRegistrationStarted
        );
    }

    /// @notice Finishes registering proposals
    function endProposalsRegistering() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Registering proposals havent started yet"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationStarted,
            WorkflowStatus.ProposalsRegistrationEnded
        );
    }

    /// @notice Begins the voting session
    function startVotingSession() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationEnded,
            "Registering proposals phase is not finished"
        );
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationEnded,
            WorkflowStatus.VotingSessionStarted
        );
    }

    /// @notice Ends the voting session
    function endVotingSession() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Voting session havent started yet"
        );
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionStarted,
            WorkflowStatus.VotingSessionEnded
        );
    }

    /* CODE BLOCK FOR POSSIBLE IMPROVEMENTS LATER :

    modifier checkWorkflowStatus(uint  _num) {
        require (workflowStatus=WorkflowStatus(uint(_num)-1), "bad workflowstatus");
        require (_num != 5, "il faut lancer tally votes");
        _;
    }
    
    function setWorkflowStatus(uint _num) public checkWorkflowStatus(_num) onlyOwner {
        WorkflowStatus old = workflowStatus;
        workflowStatus = WorkflowStatus(_num);
        emit WorkflowStatusChange(old, workflowStatus);
    }
    
    OR MORE SIMPLY :

    function nextWorkflowStatus() onlyOwner{
    require (uint(workflowStatus)!=4, "il faut lancer tallyvotes");
    WorkflowStatus old = workflowStatus;
    workflowStatus= WorkflowStatus(uint (workflowStatus) + 1);
    emit WorkflowStatusChange(old, workflowStatus);
    }
    */

    /// @notice Finding the winning proposal
    function tallyVotes() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionEnded,
            "Current status is not voting session ended"
        );

        /* CORRECTION OF THE SECURITY BREACH
        uint256 _winningProposalId;
        for (uint256 p = 0; p < proposalsArray.length; p++) {
            if (
                proposalsArray[p].voteCount >
                proposalsArray[_winningProposalId].voteCount
            ) {
                _winningProposalId = p;
            }
        }
        winningProposalID = _winningProposalId;
        */

        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionEnded,
            WorkflowStatus.VotesTallied
        );
    }

    /* CODE BLOCK FOR POSSIBLE IMPROVEMENTS LATER :

    function tallyVotesDraw() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
        uint highestCount;
        uint[5]memory winners; // Equality between 5 people max
        uint nbWinners;
        for (uint i = 0; i < proposalsArray.length; i++) {
            if (proposalsArray[i].voteCount == highestCount) {
                winners[nbWinners]=i;
                nbWinners++;
            }
            if (proposalsArray[i].voteCount > highestCount) {
                delete winners;
                winners[0]= i;
                highestCount = proposalsArray[i].voteCount;
                nbWinners=1;
            }
        }
        for(uint j=0;j<nbWinners;j++){
            winningProposalsID.push(winners[j]);
            winningProposals.push(proposalsArray[winners[j]]);
        }
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    } 
    */
}
