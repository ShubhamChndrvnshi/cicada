// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8;

import "./CicadaVote.sol";

contract PrivateVote is CicadaVote {
    constructor() {}

    function createVote(PublicParameters memory pp, string memory description, uint64 startTime, uint64 votingPeriod)
        external
    {
        _createVote(pp, description, startTime, votingPeriod);
    }

    function castBallot(uint256 voteId, PublicParameters memory pp, Puzzle memory ballot, ProofOfValidity memory PoV)
        external
    {
        _castBallot(voteId, pp, ballot, PoV);
    }

    function finalizeVote(
        uint256 voteId,
        PublicParameters memory pp,
        uint64 tallyPlaintext,
        uint256[4] memory w,
        ProofOfExponentiation memory PoE
    ) external {
        _finalizeVote(voteId, pp, tallyPlaintext, w, PoE);
    }
}
