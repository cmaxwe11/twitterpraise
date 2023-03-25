import { PraiseModel } from 'api/dist/praise/entities';
import { EventLogTypeKey } from 'api/dist/eventlog/types';
import { logEvent } from 'api/dist/eventlog/utils';
import { GuildMember, User } from 'discord.js';
import { settingValue } from 'api/dist/shared/settings';
import { getReceiverData } from '../utils/getReceiverData';
import {
  dmError,
  invalidReceiverError,
  missingReasonError,
  notActivatedError,
  praiseSuccessDM,
  roleMentionWarning,
  undefinedReceiverWarning,
  selfPraiseWarning,
  firstTimePraiserInfo,
} from '../utils/embeds/praiseEmbeds';
import { assertPraiseGiver } from '../utils/assertPraiseGiver';
import { assertPraiseAllowedInChannel } from '../utils/assertPraiseAllowedInChannel';
import { CommandHandler } from '../interfaces/CommandHandler';
import { getUserAccount } from '../utils/getUserAccount';
import { createPraise } from '../utils/createPraise';
import { praiseSuccessEmbed } from '../utils/embeds/praiseSuccessEmbed';
import { logger } from '../utils/logger';
/**
 * Execute command /praise
 *  Creates praises with a given receiver and reason
 *  with the command executor as the praise.giver
 *
 * @param  interaction
 * @param  responseUrl
 * @returns
 */
export const praiseHandler: CommandHandler = async (
  interaction,
  responseUrl
) => {
  if (!responseUrl) return;

  const { guild, channel, member } = interaction;
  if (!guild || !member || !channel) {
    await interaction.editReply(await dmError());
    return;
  }

  if (!(await assertPraiseGiver(member as GuildMember, interaction, true)))
    return;
  if (!(await assertPraiseAllowedInChannel(interaction))) return;

  const receiverOptions = interaction.options.getString('receivers');

  if (!receiverOptions || receiverOptions.length === 0) {
    await interaction.editReply(await invalidReceiverError());
    return;
  }

  const receiverData = getReceiverData(receiverOptions);

  if (
    !receiverData.validReceiverIds ||
    receiverData.validReceiverIds?.length === 0
  ) {
    await interaction.editReply(await invalidReceiverError());
    return;
  }

  const reason = interaction.options.getString('reason', true);
  if (!reason || reason.length === 0) {
    await interaction.editReply(await missingReasonError());
    return;
  }

  const giverAccount = await getUserAccount(member as GuildMember);
  const praiseItemsCount = await PraiseModel.countDocuments({
    giver: giverAccount._id,
  });

  if (!giverAccount.user) {
    await interaction.editReply(await notActivatedError());
    return;
  }

  const receivers: string[] = [];
  const receiverIds: string[] = [
    ...new Set(
      receiverData.validReceiverIds.map((id: string) => id.replace(/\D/g, ''))
    ),
  ];

  const selfPraiseAllowed = (await settingValue(
    'SELF_PRAISE_ALLOWED'
  )) as boolean;

  let warnSelfPraise = false;
  if (!selfPraiseAllowed && receiverIds.includes(giverAccount.accountId)) {
    warnSelfPraise = true;
    receiverIds.splice(receiverIds.indexOf(giverAccount.accountId), 1);
  }
  const Receivers = (await guild.members.fetch({ user: receiverIds })).map(
    (u) => u
  );

  for (const receiver of Receivers) {
    const receiverAccount = await getUserAccount(receiver);

    const praiseObj = await createPraise(
      interaction,
      giverAccount,
      receiverAccount,
      reason
    );

    if (praiseObj) {
      await logEvent(
        EventLogTypeKey.PRAISE,
        'Created a new praise from discord',
        {
          userAccountId: giverAccount._id,
        }
      );

      try {
        await receiver.send({
          embeds: [
            await praiseSuccessDM(
              responseUrl,
              receiverAccount.user ? true : false
            ),
          ],
        });
      } catch (err) {
        logger.warn(
          `Can't DM user - ${receiverAccount.name} [${receiverAccount.accountId}]`
        );
      }
      receivers.push(receiverAccount.accountId);
    } else {
      logger.error(
        `Praise not registered for [${giverAccount.accountId}] -> [${receiverAccount.accountId}] for [${reason}]`
      );
    }
  }

  if (Receivers.length !== 0) {
    await interaction.editReply('Praise given!');
    await interaction.followUp({
      embeds: [
        await praiseSuccessEmbed(
          interaction,
          receivers.map((id) => `<@!${id}>`),
          reason
        ),
      ],
      ephemeral: false,
    });
    // await interaction.followUp({
    //   content: await praiseSuccess(
    //     receivers.map((id) => `<@!${id}>`),
    //     reason
    //   ),
    //   ephemeral: false,
    // });
  } else if (warnSelfPraise) {
    await interaction.editReply(await selfPraiseWarning());
  } else {
    await interaction.editReply(await invalidReceiverError());
  }

  const warningMsg =
    (receiverData.undefinedReceivers
      ? (await undefinedReceiverWarning(
          receiverData.undefinedReceivers
            .map((id) => id.replace(/[<>]/, ''))
            .join(', '),
          member.user as User
        )) + '\n'
      : '') +
    (receiverData.roleMentions
      ? (await roleMentionWarning(
          receiverData.roleMentions.join(', '),
          member.user as User
        )) + '\n'
      : '') +
    (Receivers.length !== 0 && warnSelfPraise
      ? (await selfPraiseWarning()) + '\n'
      : '');

  if (warningMsg && warningMsg.length !== 0) {
    await interaction.followUp({ content: warningMsg, ephemeral: true });
  }

  if (
    receiverOptions.length &&
    receiverOptions.length !== 0 &&
    praiseItemsCount === 0
  ) {
    await interaction.followUp({
      content: await firstTimePraiserInfo(),
      ephemeral: true,
    });
  }
};
