import { renderMessage } from '../utils/renderMessage';
import { Praise, PraisePaginatedResponseDto } from '../utils/api-schema';
import { apiGet } from '../utils/api';
import { CommandHandler } from '../interfaces/CommandHandler';
import { queryOpenAi } from '../utils/queryOpenAi';
import { EmbedBuilder } from 'discord.js';
import Keyv from 'keyv';

const CACHE_TTL = 60 * 1000 * 60 * 24; // 24 hours

// Create a new Keyv instance for caching responses from OpenAI
const keyv = new Keyv();

/**
 * Create an embed for /whatsup command
 */
const createWhatsupEmbed = (whatsup: string): EmbedBuilder => {
  return new EmbedBuilder().setDescription(whatsup).setFooter({
    text: '🤖 This is an AI generated text generated by looking at the latest 100 praise.',
  });
};

/**
 * Get the username of the receiver of the praise
 */
const getReceiverUserName = (praise: Praise): string => {
  return praise.receiver?.user?.username || praise.receiver?.name || 'Unknown';
};

/**
 * Execute command /whatsup
 * Generate a summary of the latest 100 praise
 */
export const whatsupHandler: CommandHandler = async (
  client,
  interaction,
  host
): Promise<void> => {
  const { member, guild } = interaction;
  if (!guild || !member) {
    await interaction.editReply(await renderMessage('DM_ERROR'));
    return;
  }

  // No OPENAI_KEY, return
  if (!process.env.OPENAI_KEY) {
    await interaction.editReply("This feature isn't available yet.");
    return;
  }

  // Check if we have a cached whatsup message
  const cachedWhatsup = await keyv.get('whatsup');
  if (cachedWhatsup) {
    const embed = createWhatsupEmbed(cachedWhatsup);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Get 100 latest Praise
  const praiseResponse = await apiGet<PraisePaginatedResponseDto>(
    '/praise?limit=100&page=1&sortColumn=createdAt&sortType=desc',
    {
      headers: { host: host },
    }
  );

  // No response, return
  if (!praiseResponse.data.docs.length) {
    await interaction.editReply(
      'Unable to fetch praise. Please try again later.'
    );
    return;
  }

  // Create a CSV of the latest 100 praise
  const topPraiseCsv =
    'date, praise\n' +
    praiseResponse.data.docs
      .map(
        (praise) =>
          `${praise.createdAt}, Praise ${getReceiverUserName(praise)} ${
            praise.reason
          }`
      )
      .join('\n');

  // Create a prompt for OpenAI
  const prompt = `
    CSV List contains praise for contributions made by community members in ${host} community. Write summary for a page called "what's up".
    Use markdown formatting, use headers, no links. Use casual tone, positive, medium heat. Create a compelling summary of the community activity. Don't mention "Praise" or "Praising". Define sections freely but always include at minimum: Project Updates, Things To Look Forward To`;

  // Query OpenAI
  const whatsupResponse = await queryOpenAi(
    topPraiseCsv,
    prompt,
    process.env.OPENAI_KEY
  );

  // If no response, return
  if (!whatsupResponse) {
    await interaction.editReply(
      'Unable to generate summary. Please try again later.'
    );
    return;
  }

  // Cache the response
  await keyv.set('whatsup', whatsupResponse, CACHE_TTL);

  // Create an embed
  const embed = createWhatsupEmbed(whatsupResponse);

  // Send the embed
  await interaction.editReply({
    embeds: [embed],
  });
};
