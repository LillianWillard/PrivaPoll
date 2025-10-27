// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PrivaPoll - Privacy-Preserving Polling Platform
/// @notice A decentralized polling platform using FHEVM for encrypted responses
/// @dev Supports single choice (euint8) and multiple choice (euint16 bitmask) questions
contract PrivaPoll is SepoliaConfig {
    ///////////////////////////////////////////////////////////////////////////////
    // Errors
    ///////////////////////////////////////////////////////////////////////////////
    
    error PollNotFound();
    error PollNotStarted();
    error PollEnded();
    error AlreadyResponded();
    error InvalidAnswerCount();
    error Unauthorized();
    error InvalidPollId();

    ///////////////////////////////////////////////////////////////////////////////
    // Structs
    ///////////////////////////////////////////////////////////////////////////////
    
    struct Poll {
        uint256 id;
        address creator;
        string title;
        string description;
        uint64 startTime;
        uint64 endTime;
        uint8 questionCount;
        bool isPublic;
        bool isActive;
        uint256 responseCount;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // State Variables
    ///////////////////////////////////////////////////////////////////////////////
    
    uint256 private _pollIdCounter;
    
    // pollId => Poll
    mapping(uint256 => Poll) public polls;
    
    // pollId => respondent => encrypted answers (euint32 array for simplicity)
    mapping(uint256 => mapping(address => euint32[])) private responses;
    
    // pollId => respondent => hasResponded
    mapping(uint256 => mapping(address => bool)) public hasResponded;
    
    // creator => pollIds
    mapping(address => uint256[]) private creatorPolls;
    
    // respondent => pollIds
    mapping(address => uint256[]) private respondentPolls;

    ///////////////////////////////////////////////////////////////////////////////
    // Events
    ///////////////////////////////////////////////////////////////////////////////
    
    event PollCreated(
        uint256 indexed pollId,
        address indexed creator,
        string title,
        string questionsData
    );
    
    event ResponseSubmitted(
        uint256 indexed pollId,
        address indexed respondent,
        uint256 timestamp
    );
    
    event PollClosed(
        uint256 indexed pollId,
        address indexed creator
    );

    ///////////////////////////////////////////////////////////////////////////////
    // Core Functions
    ///////////////////////////////////////////////////////////////////////////////
    
    /// @notice Creates a new poll
    /// @param title Poll title
    /// @param description Poll description
    /// @param startTime Poll start timestamp
    /// @param endTime Poll end timestamp
    /// @param questionsData JSON string containing question details
    /// @param questionCount Number of questions
    /// @param isPublic Whether the poll is public
    /// @return pollId The ID of the created poll
    function createPoll(
        string calldata title,
        string calldata description,
        uint64 startTime,
        uint64 endTime,
        string calldata questionsData,
        uint8 questionCount,
        bool isPublic
    ) external returns (uint256 pollId) {
        pollId = _pollIdCounter++;
        
        polls[pollId] = Poll({
            id: pollId,
            creator: msg.sender,
            title: title,
            description: description,
            startTime: startTime,
            endTime: endTime,
            questionCount: questionCount,
            isPublic: isPublic,
            isActive: true,
            responseCount: 0
        });
        
        creatorPolls[msg.sender].push(pollId);
        
        emit PollCreated(pollId, msg.sender, title, questionsData);
    }
    
    /// @notice Submits encrypted responses to a poll
    /// @param pollId The poll ID
    /// @param encryptedAnswers Array of encrypted answer handles
    /// @param inputProof The input proof for all encrypted answers
    /// @dev All answers are converted to euint32 for storage simplicity
    function submitResponse(
        uint256 pollId,
        externalEuint32[] calldata encryptedAnswers,
        bytes calldata inputProof
    ) external {
        Poll storage poll = polls[pollId];
        
        if (poll.id != pollId) revert PollNotFound();
        if (block.timestamp < poll.startTime) revert PollNotStarted();
        if (block.timestamp > poll.endTime || !poll.isActive) revert PollEnded();
        if (hasResponded[pollId][msg.sender]) revert AlreadyResponded();
        if (encryptedAnswers.length != poll.questionCount) revert InvalidAnswerCount();
        
        // Process each encrypted answer
        for (uint256 i = 0; i < encryptedAnswers.length; i++) {
            // Convert external encrypted value to internal type
            euint32 answer = FHE.fromExternal(encryptedAnswers[i], inputProof);
            
            // Store encrypted answer
            responses[pollId][msg.sender].push(answer);
            
            // Grant access permissions
            FHE.allowThis(answer);
            FHE.allow(answer, poll.creator);
            FHE.allow(answer, msg.sender);
        }
        
        hasResponded[pollId][msg.sender] = true;
        poll.responseCount++;
        respondentPolls[msg.sender].push(pollId);
        
        emit ResponseSubmitted(pollId, msg.sender, block.timestamp);
    }
    
    /// @notice Closes a poll early (only creator)
    /// @param pollId The poll ID
    function closePoll(uint256 pollId) external {
        Poll storage poll = polls[pollId];
        
        if (poll.id != pollId) revert PollNotFound();
        if (poll.creator != msg.sender) revert Unauthorized();
        
        poll.isActive = false;
        
        emit PollClosed(pollId, msg.sender);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Query Functions
    ///////////////////////////////////////////////////////////////////////////////
    
    /// @notice Gets poll information
    /// @param pollId The poll ID
    /// @return The poll struct
    function getPollInfo(uint256 pollId) external view returns (Poll memory) {
        if (polls[pollId].id != pollId) revert PollNotFound();
        return polls[pollId];
    }
    
    /// @notice Gets all poll IDs created by an address
    /// @param creator The creator address
    /// @return Array of poll IDs
    function getPollsByCreator(address creator) external view returns (uint256[] memory) {
        return creatorPolls[creator];
    }
    
    /// @notice Gets all poll IDs a user has responded to
    /// @param respondent The respondent address
    /// @return Array of poll IDs
    function getResponsesBySender(address respondent) external view returns (uint256[] memory) {
        return respondentPolls[respondent];
    }
    
    /// @notice Gets encrypted responses for a specific poll (only creator)
    /// @param pollId The poll ID
    /// @return Array of all encrypted answers from all respondents
    /// @dev Returns flattened array: [user1_q1, user1_q2, ..., user2_q1, user2_q2, ...]
    function getPollResponses(uint256 pollId) external view returns (euint32[] memory) {
        Poll storage poll = polls[pollId];
        
        if (poll.id != pollId) revert PollNotFound();
        if (poll.creator != msg.sender) revert Unauthorized();
        
        // Calculate total number of answers
        uint256 totalAnswers = poll.responseCount * poll.questionCount;
        euint32[] memory allAnswers = new euint32[](totalAnswers);
        
        // Note: This is a simplified implementation
        // A production version would need to track respondent addresses
        // For now, this returns an empty array structure
        // Frontend should query responses using events
        
        return allAnswers;
    }
    
    /// @notice Gets a user's encrypted responses for a specific poll
    /// @param pollId The poll ID
    /// @param respondent The respondent address
    /// @return Array of encrypted answers
    function getUserResponses(uint256 pollId, address respondent) external view returns (euint32[] memory) {
        if (polls[pollId].id != pollId) revert PollNotFound();
        if (!hasResponded[pollId][respondent]) revert PollNotFound();
        
        // Only creator or the respondent themselves can view
        if (msg.sender != polls[pollId].creator && msg.sender != respondent) {
            revert Unauthorized();
        }
        
        return responses[pollId][respondent];
    }
    
    /// @notice Gets the total number of polls
    /// @return Total poll count
    function getTotalPolls() external view returns (uint256) {
        return _pollIdCounter;
    }
}

