const ForeignBridge = artifacts.require('ForeignCompoundBridgeErcToErc.sol')
const BridgeValidators = artifacts.require('BridgeValidators.sol')
const EternalStorageProxy = artifacts.require('EternalStorageProxy.sol')
const ERC677BridgeToken = artifacts.require('ERC677BridgeToken.sol')
const CToken = artifacts.require('CTokenMock.sol')

const { expect } = require('chai')
const { ERROR_MSG, ZERO_ADDRESS, toBN } = require('../setup')
const { createMessage, sign, signatureToVRS, ether, expectEventInLogs } = require('../helpers/helpers')

const oneEther = ether('1')
const halfEther = ether('0.5')
const requireBlockConfirmations = 8
const gasPrice = web3.utils.toWei('1', 'gwei')
const homeDailyLimit = oneEther
const homeMaxPerTx = halfEther
const maxPerTx = halfEther
const minPerTx = ether('0.01')
const dailyLimit = oneEther
const ZERO = toBN(0)
const decimalShiftZero = 0

contract('Compound ForeignBridge_ERC20_to_ERC20', async accounts => {
  let validatorContract
  let authorities
  let owner
  let token
  let ctoken;

  before(async () => {
    validatorContract = await BridgeValidators.new()
    authorities = [accounts[1], accounts[2]]
    owner = accounts[0]
    await validatorContract.initialize(1, authorities, owner)
  })
  describe('#initialize', async () => {
    it('should initialize', async () => {
      token = await ERC677BridgeToken.new('Some ERC20', 'RSZT', 18)
      ctoken = await CToken.new(token.address)
      const foreignBridge = await ForeignBridge.new()

      expect(await foreignBridge.erc20token()).to.be.equal(ZERO_ADDRESS)
      expect(await foreignBridge.ctoken()).to.be.equal(ZERO_ADDRESS)
      expect(await foreignBridge.validatorContract()).to.be.equal(ZERO_ADDRESS)
      expect(await foreignBridge.deployedAtBlock()).to.be.bignumber.equal(ZERO)
      expect(await foreignBridge.isInitialized()).to.be.equal(false)
      expect(await foreignBridge.decimalShift()).to.be.bignumber.equal(ZERO)
      expect(await foreignBridge.requiredBlockConfirmations()).to.be.bignumber.equal(ZERO)

      await foreignBridge
        .initialize(
          ZERO_ADDRESS,
          token.address,
          ctoken.address,
          requireBlockConfirmations,
          gasPrice,
          [dailyLimit, maxPerTx, minPerTx],
          [homeDailyLimit, homeMaxPerTx],
          owner,
          decimalShiftZero
        )
        .should.be.rejectedWith(ERROR_MSG)
      await foreignBridge
        .initialize(
          validatorContract.address,
          ZERO_ADDRESS,
          ctoken.address,
          requireBlockConfirmations,
          gasPrice,
          [dailyLimit, maxPerTx, minPerTx],
          [homeDailyLimit, homeMaxPerTx],
          owner,
          decimalShiftZero
        )
        .should.be.rejectedWith(ERROR_MSG)
      await foreignBridge
        .initialize(
          validatorContract.address,
          owner,
          ctoken.address,
          requireBlockConfirmations,
          gasPrice,
          [dailyLimit, maxPerTx, minPerTx],
          [homeDailyLimit, homeMaxPerTx],
          owner,
          decimalShiftZero
        )
        .should.be.rejectedWith(ERROR_MSG)
      await foreignBridge
        .initialize(
          validatorContract.address,
          token.address,
          ZERO_ADDRESS,
          requireBlockConfirmations,
          gasPrice,
          [dailyLimit, maxPerTx, minPerTx],
          [homeDailyLimit, homeMaxPerTx],
          owner,
          decimalShiftZero
        )
        .should.be.rejectedWith(ERROR_MSG)
      await foreignBridge
        .initialize(
          validatorContract.address,
          token.address,
          owner,
          requireBlockConfirmations,
          gasPrice,
          [dailyLimit, maxPerTx, minPerTx],
          [homeDailyLimit, homeMaxPerTx],
          owner,
          decimalShiftZero
        )
        .should.be.rejectedWith(ERROR_MSG)
      await foreignBridge
        .initialize(
          validatorContract.address,
          token.address,
          ctoken.address,
          0,
          gasPrice,
          [dailyLimit, maxPerTx, minPerTx],
          [homeDailyLimit, homeMaxPerTx],
          owner,
          decimalShiftZero
        )
        .should.be.rejectedWith(ERROR_MSG)
      await foreignBridge
        .initialize(
          validatorContract.address,
          token.address,
          ctoken.address,
          requireBlockConfirmations,
          0,
          [dailyLimit, maxPerTx, minPerTx],
          [homeDailyLimit, homeMaxPerTx],
          owner,
          decimalShiftZero
        )
        .should.be.rejectedWith(ERROR_MSG)
      await foreignBridge
        .initialize(
          owner,
          token.address,
          ctoken.address,
          requireBlockConfirmations,
          gasPrice,
          [dailyLimit, maxPerTx, minPerTx],
          [homeDailyLimit, homeMaxPerTx],
          owner,
          decimalShiftZero
        )
        .should.be.rejectedWith(ERROR_MSG)

      await foreignBridge
        .initialize(
          validatorContract.address,
          token.address,
          ctoken.address,
          requireBlockConfirmations,
          gasPrice,
          [dailyLimit, maxPerTx, maxPerTx],
          [homeDailyLimit, homeMaxPerTx],
          owner,
          decimalShiftZero
        )
        .should.be.rejectedWith(ERROR_MSG)
      await foreignBridge
        .initialize(
          validatorContract.address,
          token.address,
          ctoken.address,
          requireBlockConfirmations,
          gasPrice,
          [dailyLimit, dailyLimit, minPerTx],
          [homeDailyLimit, homeMaxPerTx],
          owner,
          decimalShiftZero
        )
        .should.be.rejectedWith(ERROR_MSG)

      const { logs } = await foreignBridge.initialize(
        validatorContract.address,
        token.address,
        ctoken.address,
        requireBlockConfirmations,
        gasPrice,
        [dailyLimit, maxPerTx, minPerTx],
        [homeDailyLimit, homeMaxPerTx],
        owner,
        '9'
      )

      expect(await foreignBridge.erc20token()).to.be.equal(token.address)
      expect(await foreignBridge.isInitialized()).to.be.equal(true)
      expect(await foreignBridge.validatorContract()).to.be.equal(validatorContract.address)
      expect(await foreignBridge.deployedAtBlock()).to.be.bignumber.above(ZERO)
      expect(await foreignBridge.requiredBlockConfirmations()).to.be.bignumber.equal(
        requireBlockConfirmations.toString()
      )
      expect(await foreignBridge.dailyLimit()).to.be.bignumber.equal(dailyLimit)
      expect(await foreignBridge.maxPerTx()).to.be.bignumber.equal(maxPerTx)
      expect(await foreignBridge.minPerTx()).to.be.bignumber.equal(minPerTx)
      expect(await foreignBridge.decimalShift()).to.be.bignumber.equal('9')
      expect(await foreignBridge.gasPrice()).to.be.bignumber.equal(gasPrice)
      const bridgeMode = '0xba4690f5' // 4 bytes of keccak256('erc-to-erc-core')
      expect(await foreignBridge.getBridgeMode()).to.be.equal(bridgeMode)
      const { major, minor, patch } = await foreignBridge.getBridgeInterfacesVersion()
      expect(major).to.be.bignumber.gte(ZERO)
      expect(minor).to.be.bignumber.gte(ZERO)
      expect(patch).to.be.bignumber.gte(ZERO)

      expectEventInLogs(logs, 'RequiredBlockConfirmationChanged', {
        requiredBlockConfirmations: toBN(requireBlockConfirmations)
      })
      expectEventInLogs(logs, 'GasPriceChanged', { gasPrice })
      expectEventInLogs(logs, 'DailyLimitChanged', { newLimit: dailyLimit })
      expectEventInLogs(logs, 'ExecutionDailyLimitChanged', { newLimit: homeDailyLimit })
    })
  })
  describe('#executeSignatures', async () => {
    const value = ether('0.25')
    let foreignBridge
    beforeEach(async () => {
      foreignBridge = await ForeignBridge.new()
      token = await ERC677BridgeToken.new('Some ERC20', 'RSZT', 18)
      ctoken = await CToken.new(token.address)
      await foreignBridge.initialize(
        validatorContract.address,
        token.address,
        ctoken.address,
        requireBlockConfirmations,
        gasPrice,
        [dailyLimit, maxPerTx, minPerTx],
        [homeDailyLimit, homeMaxPerTx],
        owner,
        decimalShiftZero
      )
      await token.mint(accounts[0], value)
      await token.approve(foreignBridge.address, value)
      await foreignBridge.join(accounts[0], value)
      await token.mint(ctoken.address, value)
    })
    it('should allow to executeSignatures', async () => {
      const recipientAccount = accounts[3]
      const balanceBefore = await token.balanceOf(recipientAccount)

      const transactionHash = '0x1045bfe274b88120a6b1e5d01b5ec00ab5d01098346e90e7c7a3c9b8f0181c80'
      const message = createMessage(recipientAccount, value, transactionHash, foreignBridge.address)
      const signature = await sign(authorities[0], message)
      const vrs = signatureToVRS(signature)
      false.should.be.equal(await foreignBridge.relayedMessages(transactionHash))
      const { logs } = await foreignBridge.executeSignatures([vrs.v], [vrs.r], [vrs.s], message).should.be.fulfilled
      logs[0].event.should.be.equal('RelayedMessage')
      logs[0].args.recipient.should.be.equal(recipientAccount)
      logs[0].args.value.should.be.bignumber.equal(value)

      const balanceAfter = await token.balanceOf(recipientAccount)
      const balanceAfterBridge = await token.balanceOf(foreignBridge.address)
      balanceAfter.should.be.bignumber.equal(balanceBefore.add(value))
      balanceAfterBridge.should.be.bignumber.equal(ZERO)
      true.should.be.equal(await foreignBridge.relayedMessages(transactionHash))
    })
    it('should allow second withdrawal with different transactionHash but same recipient and value', async () => {
      const recipientAccount = accounts[3]
      const balanceBefore = await token.balanceOf(recipientAccount)
      // tx 1
      const transactionHash = '0x35d3818e50234655f6aebb2a1cfbf30f59568d8a4ec72066fac5a25dbe7b8121'
      const message = createMessage(recipientAccount, value, transactionHash, foreignBridge.address)
      const signature = await sign(authorities[0], message)
      const vrs = signatureToVRS(signature)
      false.should.be.equal(await foreignBridge.relayedMessages(transactionHash))
      await foreignBridge.executeSignatures([vrs.v], [vrs.r], [vrs.s], message).should.be.fulfilled
      // tx 2
      await token.mint(accounts[0], value)
      await token.approve(foreignBridge.address, value)
      await foreignBridge.join(accounts[0], value)
      const transactionHash2 = '0x77a496628a776a03d58d7e6059a5937f04bebd8ba4ff89f76dd4bb8ba7e291ee'
      const message2 = createMessage(recipientAccount, value, transactionHash2, foreignBridge.address)
      const signature2 = await sign(authorities[0], message2)
      const vrs2 = signatureToVRS(signature2)
      false.should.be.equal(await foreignBridge.relayedMessages(transactionHash2))
      const { logs } = await foreignBridge.executeSignatures([vrs2.v], [vrs2.r], [vrs2.s], message2).should.be.fulfilled

      logs[0].event.should.be.equal('RelayedMessage')
      logs[0].args.recipient.should.be.equal(recipientAccount)
      logs[0].args.value.should.be.bignumber.equal(value)
      const balanceAfter = await token.balanceOf(recipientAccount)
      balanceAfter.should.be.bignumber.equal(balanceBefore.add(value.mul(toBN(2))))
      true.should.be.equal(await foreignBridge.relayedMessages(transactionHash))
      true.should.be.equal(await foreignBridge.relayedMessages(transactionHash2))
    })

    it('should not allow second withdraw (replay attack) with same transactionHash but different recipient', async () => {
      const recipientAccount = accounts[3]
      // tx 1
      const transactionHash = '0x35d3818e50234655f6aebb2a1cfbf30f59568d8a4ec72066fac5a25dbe7b8121'
      const message = createMessage(recipientAccount, value, transactionHash, foreignBridge.address)
      const signature = await sign(authorities[0], message)
      const vrs = signatureToVRS(signature)
      false.should.be.equal(await foreignBridge.relayedMessages(transactionHash))
      await foreignBridge.executeSignatures([vrs.v], [vrs.r], [vrs.s], message).should.be.fulfilled
      // tx 2
      await token.mint(accounts[0], value)
      await token.approve(foreignBridge.address, value)
      await foreignBridge.join(accounts[0], value)
      const message2 = createMessage(accounts[4], value, transactionHash, foreignBridge.address)
      const signature2 = await sign(authorities[0], message2)
      const vrs2 = signatureToVRS(signature2)
      true.should.be.equal(await foreignBridge.relayedMessages(transactionHash))
      await foreignBridge.executeSignatures([vrs2.v], [vrs2.r], [vrs2.s], message2).should.be.rejectedWith(ERROR_MSG)
    })

    it('should not allow withdraw over home max tx limit', async () => {
      const recipientAccount = accounts[3]
      const invalidValue = ether('0.75');
      await token.mint(accounts[0], ether('0.75'))
      await token.approve(foreignBridge.address, ether('0.75'))
      await foreignBridge.join(accounts[0], ether('0.75'))

      const transactionHash = '0x35d3818e50234655f6aebb2a1cfbf30f59568d8a4ec72066fac5a25dbe7b8121'
      const message = createMessage(recipientAccount, invalidValue, transactionHash, foreignBridge.address)
      const signature = await sign(authorities[0], message)
      const vrs = signatureToVRS(signature)

      await foreignBridge.executeSignatures([vrs.v], [vrs.r], [vrs.s], message).should.be.rejectedWith(ERROR_MSG)
    })

    it('should not allow withdraw over daily home limit', async () => {
      const recipientAccount = accounts[3]
      await token.mint(accounts[0], ether('5'))
      await token.approve(foreignBridge.address, ether('5'))
      await foreignBridge.join(accounts[0], ether('5'))
      const transactionHash = '0x35d3818e50234655f6aebb2a1cfbf30f59568d8a4ec72066fac5a25dbe7b8121'
      const message = createMessage(recipientAccount, halfEther, transactionHash, foreignBridge.address)
      const signature = await sign(authorities[0], message)
      const vrs = signatureToVRS(signature)

      await foreignBridge.executeSignatures([vrs.v], [vrs.r], [vrs.s], message).should.be.fulfilled

      const transactionHash2 = '0x69debd8fd1923c9cb3cd8ef6461e2740b2d037943b941729d5a47671a2bb8712'
      const message2 = createMessage(recipientAccount, halfEther, transactionHash2, foreignBridge.address)
      const signature2 = await sign(authorities[0], message2)
      const vrs2 = signatureToVRS(signature2)

      await foreignBridge.executeSignatures([vrs2.v], [vrs2.r], [vrs2.s], message2).should.be.fulfilled

      const transactionHash3 = '0x022695428093bb292db8e48bd1417c5e1b84c0bf673bd0fff23ed0fb6495b872'
      const message3 = createMessage(recipientAccount, halfEther, transactionHash3, foreignBridge.address)
      const signature3 = await sign(authorities[0], message3)
      const vrs3 = signatureToVRS(signature3)

      await foreignBridge.executeSignatures([vrs3.v], [vrs3.r], [vrs3.s], message3).should.be.rejectedWith(ERROR_MSG)
    })
  })

  describe('#withdraw with 2 minimum signatures', async () => {
    let multisigValidatorContract
    let twoAuthorities
    let ownerOfValidatorContract
    let foreignBridgeWithMultiSignatures
    const value = halfEther
    beforeEach(async () => {
      multisigValidatorContract = await BridgeValidators.new()
      token = await ERC677BridgeToken.new('Some ERC20', 'RSZT', 18)
      ctoken = await CToken.new(token.address)
      twoAuthorities = [accounts[0], accounts[1]]
      ownerOfValidatorContract = accounts[3]
      await multisigValidatorContract.initialize(2, twoAuthorities, ownerOfValidatorContract, {
        from: ownerOfValidatorContract
      })
      foreignBridgeWithMultiSignatures = await ForeignBridge.new()
      await foreignBridgeWithMultiSignatures.initialize(
        multisigValidatorContract.address,
        token.address,
        ctoken.address,
        requireBlockConfirmations,
        gasPrice,
        [dailyLimit, maxPerTx, minPerTx],
        [homeDailyLimit, homeMaxPerTx],
        owner,
        decimalShiftZero,
        { from: ownerOfValidatorContract }
      )
      await token.mint(accounts[0], value)
      await token.mint(ctoken.address, value)
      await token.approve(foreignBridgeWithMultiSignatures.address, value)
      await foreignBridgeWithMultiSignatures.join(accounts[0], value)
    })
    it('withdraw should fail if not enough signatures are provided', async () => {
      const recipientAccount = accounts[4]
      // msg 1
      const transactionHash = '0x35d3818e50234655f6aebb2a1cfbf30f59568d8a4ec72066fac5a25dbe7b8121'
      const message = createMessage(recipientAccount, value, transactionHash, foreignBridgeWithMultiSignatures.address)
      const signature = await sign(twoAuthorities[0], message)
      const vrs = signatureToVRS(signature)
      false.should.be.equal(await foreignBridgeWithMultiSignatures.relayedMessages(transactionHash))
      await foreignBridgeWithMultiSignatures
        .executeSignatures([vrs.v], [vrs.r], [vrs.s], message)
        .should.be.rejectedWith(ERROR_MSG)
      // msg 2
      const signature2 = await sign(twoAuthorities[1], message)
      const vrs2 = signatureToVRS(signature2)
      const { logs } = await foreignBridgeWithMultiSignatures.executeSignatures(
        [vrs.v, vrs2.v],
        [vrs.r, vrs2.r],
        [vrs.s, vrs2.s],
        message
      ).should.be.fulfilled

      logs[0].event.should.be.equal('RelayedMessage')
      logs[0].args.recipient.should.be.equal(recipientAccount)
      logs[0].args.value.should.be.bignumber.equal(value)
      true.should.be.equal(await foreignBridgeWithMultiSignatures.relayedMessages(transactionHash))
    })
    it('withdraw should fail if duplicate signature is provided', async () => {
      const recipientAccount = accounts[4]
      const transactionHash = '0x35d3818e50234655f6aebb2a1cfbf30f59568d8a4ec72066fac5a25dbe7b8121'
      const message = createMessage(recipientAccount, value, transactionHash, foreignBridgeWithMultiSignatures.address)
      const signature = await sign(twoAuthorities[0], message)
      const vrs = signatureToVRS(signature)
      false.should.be.equal(await foreignBridgeWithMultiSignatures.relayedMessages(transactionHash))
      await foreignBridgeWithMultiSignatures
        .executeSignatures([vrs.v, vrs.v], [vrs.r, vrs.r], [vrs.s, vrs.s], message)
        .should.be.rejectedWith(ERROR_MSG)
    })

    it('works with 5 validators and 3 required signatures', async () => {
      const recipient = accounts[8]
      const authoritiesFiveAccs = [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]]
      const ownerOfValidators = accounts[0]
      const validatorContractWith3Signatures = await BridgeValidators.new()
      await validatorContractWith3Signatures.initialize(3, authoritiesFiveAccs, ownerOfValidators)
      const erc20Token = await ERC677BridgeToken.new('Some ERC20', 'RSZT', 18)
      const ctoken = await CToken.new(erc20Token.address)
      const value = halfEther
      const foreignBridgeWithThreeSigs = await ForeignBridge.new()

      await foreignBridgeWithThreeSigs.initialize(
        validatorContractWith3Signatures.address,
        erc20Token.address,
        ctoken.address,
        requireBlockConfirmations,
        gasPrice,
        [dailyLimit, maxPerTx, minPerTx],
        [homeDailyLimit, homeMaxPerTx],
        owner,
        decimalShiftZero
      )
      await erc20Token.mint(accounts[0], value)
      await erc20Token.mint(ctoken.address, value)
      await erc20Token.approve(foreignBridgeWithThreeSigs.address, value)
      await foreignBridgeWithThreeSigs.join(accounts[0], value).should.be.fulfilled

      const txHash = '0x35d3818e50234655f6aebb2a1cfbf30f59568d8a4ec72066fac5a25dbe7b8121'
      const message = createMessage(recipient, value, txHash, foreignBridgeWithThreeSigs.address)

      // signature 1
      const signature = await sign(authoritiesFiveAccs[0], message)
      const vrs = signatureToVRS(signature)

      // signature 2
      const signature2 = await sign(authoritiesFiveAccs[1], message)
      const vrs2 = signatureToVRS(signature2)

      // signature 3
      const signature3 = await sign(authoritiesFiveAccs[2], message)
      const vrs3 = signatureToVRS(signature3)

      const { logs } = await foreignBridgeWithThreeSigs.executeSignatures(
        [vrs.v, vrs2.v, vrs3.v],
        [vrs.r, vrs2.r, vrs3.r],
        [vrs.s, vrs2.s, vrs3.s],
        message
      ).should.be.fulfilled
      logs[0].event.should.be.equal('RelayedMessage')
      logs[0].args.recipient.should.be.equal(recipient)
      logs[0].args.value.should.be.bignumber.equal(value)
      true.should.be.equal(await foreignBridgeWithThreeSigs.relayedMessages(txHash))
    })
  })

  describe('#claimTokens', async () => {
    it('can send erc20', async () => {
      const owner = accounts[0]
      token = await ERC677BridgeToken.new('Some ERC20', 'RSZT', 18)
      ctoken = await CToken.new(token.address)
      const foreignBridgeImpl = await ForeignBridge.new()
      const storageProxy = await EternalStorageProxy.new().should.be.fulfilled
      await storageProxy.upgradeTo('1', foreignBridgeImpl.address).should.be.fulfilled
      const foreignBridge = await ForeignBridge.at(storageProxy.address)
      await foreignBridge.initialize(
        validatorContract.address,
        token.address,
        ctoken.address,
        requireBlockConfirmations,
        gasPrice,
        [dailyLimit, maxPerTx, minPerTx],
        [homeDailyLimit, homeMaxPerTx],
        owner,
        decimalShiftZero
      )

      const tokenSecond = await ERC677BridgeToken.new('Roman Token', 'RST', 18)

      await tokenSecond.mint(accounts[0], halfEther).should.be.fulfilled
      expect(await tokenSecond.balanceOf(accounts[0])).to.be.bignumber.equal(halfEther)

      await tokenSecond.transfer(foreignBridge.address, halfEther)
      expect(await tokenSecond.balanceOf(accounts[0])).to.be.bignumber.equal(ZERO)
      expect(await tokenSecond.balanceOf(foreignBridge.address)).to.be.bignumber.equal(halfEther)

      await foreignBridge
        .claimTokens(tokenSecond.address, accounts[3], { from: accounts[3] })
        .should.be.rejectedWith(ERROR_MSG)
      await foreignBridge.claimTokens(tokenSecond.address, accounts[3], { from: owner })
      expect(await tokenSecond.balanceOf(foreignBridge.address)).to.be.bignumber.equal(ZERO)
      expect(await tokenSecond.balanceOf(accounts[3])).to.be.bignumber.equal(halfEther)
    })
  })

  describe('#decimalShift', async () => {
    const decimalShiftTwo = 2
    it('Home to Foreign: withdraw with 1 signature with a decimalShift of 2', async () => {
      const valueOnForeign = toBN('1000')
      // Value is decimals shifted from foreign to home: Native on home = 16+2 shift = 18 decimals
      const valueOnHome = toBN(valueOnForeign * 10 ** decimalShiftTwo)
      const foreignBridge = await ForeignBridge.new()
      token = await ERC677BridgeToken.new('Some ERC20', 'RSZT', 16)
      ctoken = await CToken.new(token.address)
      await foreignBridge.initialize(
        validatorContract.address,
        token.address,
        ctoken.address,
        requireBlockConfirmations,
        gasPrice,
        [dailyLimit, maxPerTx, minPerTx],
        [homeDailyLimit, homeMaxPerTx],
        owner,
        decimalShiftTwo
      )
      await token.mint(accounts[0], valueOnForeign)
      await token.mint(ctoken.address, valueOnForeign)
      await token.approve(foreignBridge.address, valueOnForeign)
      await foreignBridge.join(accounts[0], valueOnForeign).should.be.fulfilled

      const recipientAccount = accounts[3]
      const balanceBefore = await token.balanceOf(recipientAccount)

      const transactionHash = '0x1045bfe274b88120a6b1e5d01b5ec00ab5d01098346e90e7c7a3c9b8f0181c80'
      const message = createMessage(recipientAccount, valueOnHome, transactionHash, foreignBridge.address)
      const signature = await sign(authorities[0], message)
      const vrs = signatureToVRS(signature)
      false.should.be.equal(await foreignBridge.relayedMessages(transactionHash))
      const { logs } = await foreignBridge.executeSignatures([vrs.v], [vrs.r], [vrs.s], message).should.be.fulfilled
      logs[0].event.should.be.equal('RelayedMessage')
      logs[0].args.recipient.should.be.equal(recipientAccount)
      logs[0].args.value.should.be.bignumber.equal(valueOnHome)

      const balanceAfter = await token.balanceOf(recipientAccount)
      const balanceAfterBridge = await token.balanceOf(foreignBridge.address)
      balanceAfter.should.be.bignumber.equal(balanceBefore.add(valueOnForeign))
      balanceAfterBridge.should.be.bignumber.equal(ZERO)
      true.should.be.equal(await foreignBridge.relayedMessages(transactionHash))
    })
    it('Home to Foreign : withdraw works with 5 validators and 3 required signatures with a decimalShift of 2', async () => {
      const valueOnForeign = toBN('1000')
      // Value is decimals shifted from foreign to home: Native on home = 16+2 shift = 18 decimals
      const valueOnHome = toBN(valueOnForeign * 10 ** decimalShiftTwo)
      const recipient = accounts[8]
      const authoritiesFiveAccs = [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]]
      const ownerOfValidators = accounts[0]
      const validatorContractWith3Signatures = await BridgeValidators.new()
      await validatorContractWith3Signatures.initialize(3, authoritiesFiveAccs, ownerOfValidators)
      const erc20Token = await ERC677BridgeToken.new('Some ERC20', 'RSZT', 16)
      ctoken = await CToken.new(erc20Token.address)
      const foreignBridgeWithThreeSigs = await ForeignBridge.new()

      await foreignBridgeWithThreeSigs.initialize(
        validatorContractWith3Signatures.address,
        erc20Token.address,
        ctoken.address,
        requireBlockConfirmations,
        gasPrice,
        [dailyLimit, maxPerTx, minPerTx],
        [homeDailyLimit, homeMaxPerTx],
        owner,
        decimalShiftTwo
      )
      await erc20Token.mint(accounts[0], valueOnForeign)
      await erc20Token.mint(ctoken.address, valueOnForeign)
      await erc20Token.approve(foreignBridgeWithThreeSigs.address, valueOnForeign)
      await foreignBridgeWithThreeSigs.join(accounts[0], valueOnForeign)

      const balanceBeforeRecipient = await erc20Token.balanceOf(recipient)
      const balanceBeforeBridge = await ctoken.balanceOf(foreignBridgeWithThreeSigs.address)
      const txHash = '0x35d3818e50234655f6aebb2a1cfbf30f59568d8a4ec72066fac5a25dbe7b8121'
      const message = createMessage(recipient, valueOnHome, txHash, foreignBridgeWithThreeSigs.address)

      // signature 1
      const signature = await sign(authoritiesFiveAccs[0], message)
      const vrs = signatureToVRS(signature)

      // signature 2
      const signature2 = await sign(authoritiesFiveAccs[1], message)
      const vrs2 = signatureToVRS(signature2)

      // signature 3
      const signature3 = await sign(authoritiesFiveAccs[2], message)
      const vrs3 = signatureToVRS(signature3)

      const { logs } = await foreignBridgeWithThreeSigs.executeSignatures(
        [vrs.v, vrs2.v, vrs3.v],
        [vrs.r, vrs2.r, vrs3.r],
        [vrs.s, vrs2.s, vrs3.s],
        message
      ).should.be.fulfilled
      logs[0].event.should.be.equal('RelayedMessage')
      logs[0].args.recipient.should.be.equal(recipient)
      logs[0].args.value.should.be.bignumber.equal(valueOnHome)
      true.should.be.equal(await foreignBridgeWithThreeSigs.relayedMessages(txHash))
      const balanceAfterRecipient = await erc20Token.balanceOf(recipient)
      balanceAfterRecipient.should.be.bignumber.equal(balanceBeforeRecipient.add(valueOnForeign))
      const balanceAfterBridge = await erc20Token.balanceOf(foreignBridgeWithThreeSigs.address)
      balanceBeforeBridge.should.be.bignumber.equal(balanceAfterBridge.add(valueOnForeign))
    })
  })
  describe('#relayTokens', () => {
    const value = ether('0.25')
    const user = accounts[7]
    const recipient = accounts[8]
    let foreignBridge
    beforeEach(async () => {
      foreignBridge = await ForeignBridge.new()
      token = await ERC677BridgeToken.new('Some ERC20', 'RSZT', 18)
      ctoken = await CToken.new(token.address)
      await foreignBridge.initialize(
        validatorContract.address,
        token.address,
        ctoken.address,
        requireBlockConfirmations,
        gasPrice,
        [dailyLimit, maxPerTx, minPerTx],
        [homeDailyLimit, homeMaxPerTx],
        owner,
        decimalShiftZero
      )
      await token.mint(user, ether('2'))
    })
    it('should allow to bridge tokens using approve tranferFrom', async () => {
      // Given
      const currentDay = await foreignBridge.getCurrentDay()
      expect(await foreignBridge.totalSpentPerDay(currentDay)).to.be.bignumber.equal(ZERO)
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, value, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)

      await token.approve(foreignBridge.address, value, { from: user }).should.be.fulfilled

      // When
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, ZERO_ADDRESS, value, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, foreignBridge.address, value, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, 0, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)
      const { logs } = await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, value, {
        from: user
      }).should.be.fulfilled

      // Then
      expect(await foreignBridge.totalSpentPerDay(currentDay)).to.be.bignumber.equal(value)
      expectEventInLogs(logs, 'UserRequestForAffirmation', {
        recipient,
        value
      })
    })
    it('should allow to call relayTokens without specifying the sender', async () => {
      // Given
      await foreignBridge.methods['relayTokens(address,uint256)'](recipient, value, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)

      await token.approve(foreignBridge.address, value, { from: user }).should.be.fulfilled

      // When
      await foreignBridge.methods['relayTokens(address,uint256)'](ZERO_ADDRESS, value, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)
      await foreignBridge.methods['relayTokens(address,uint256)'](foreignBridge.address, value, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)
      await foreignBridge.methods['relayTokens(address,uint256)'](recipient, 0, { from: user }).should.be.rejectedWith(
        ERROR_MSG
      )
      const { logs } = await foreignBridge.methods['relayTokens(address,uint256)'](recipient, value, { from: user })
        .should.be.fulfilled

      // Then
      expectEventInLogs(logs, 'UserRequestForAffirmation', {
        recipient,
        value
      })
    })
    it('should not be able to transfer more than limit', async () => {
      // Given
      const userSupply = ether('2')
      const bigValue = oneEther
      const smallValue = ether('0.001')
      const currentDay = await foreignBridge.getCurrentDay()
      expect(await foreignBridge.totalSpentPerDay(currentDay)).to.be.bignumber.equal(ZERO)

      await token.approve(foreignBridge.address, userSupply, { from: user }).should.be.fulfilled

      // When
      // value < minPerTx
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, smallValue, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)
      // value > maxPerTx
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, bigValue, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)

      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, halfEther, { from: user })
        .should.be.fulfilled
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, halfEther, { from: user })
        .should.be.fulfilled
      // totalSpentPerDay > dailyLimit
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, halfEther, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)

      // Then
      expect(await foreignBridge.totalSpentPerDay(currentDay)).to.be.bignumber.equal(oneEther)
    })
    it('should allow only sender to specify a different receiver', async () => {
      // Given
      const currentDay = await foreignBridge.getCurrentDay()
      expect(await foreignBridge.totalSpentPerDay(currentDay)).to.be.bignumber.equal(ZERO)

      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, value, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)

      await token.approve(foreignBridge.address, oneEther, { from: user }).should.be.fulfilled

      // When
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, ZERO_ADDRESS, value, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, foreignBridge.address, value, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, 0, {
        from: user
      }).should.be.rejectedWith(ERROR_MSG)
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, value, {
        from: recipient
      }).should.be.rejectedWith(ERROR_MSG)
      await foreignBridge.methods['relayTokens(address,address,uint256)'](user, user, value, { from: user }).should.be
        .fulfilled
      const { logs } = await foreignBridge.methods['relayTokens(address,address,uint256)'](user, recipient, value, {
        from: user
      }).should.be.fulfilled
      const { logs: logsSecondTx } = await foreignBridge.methods['relayTokens(address,address,uint256)'](
        user,
        user,
        value,
        { from: recipient }
      ).should.be.fulfilled

      // Then
      expectEventInLogs(logs, 'UserRequestForAffirmation', {
        recipient,
        value
      })
      expectEventInLogs(logsSecondTx, 'UserRequestForAffirmation', {
        recipient: user,
        value
      })
    })
  })
})
