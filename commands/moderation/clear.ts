import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Message, Collection, User } from 'discord.js'

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears a specified amount of messages')
        .addIntegerOption(option => option.setName('amount').setDescription('The amount of messages to clear').setMinValue(1).setMaxValue(100).setRequired(true))
        .addUserOption(option => option.setName('user').setDescription('The user to clear messages from')),
    async execute(interaction: ChatInputCommandInteraction) {
        const { options, channel } = interaction
        const amount: number = (val => val > 100 ? 100 : val)(options.getInteger('amount') || 0)
        const user: User | null = options.getUser('user')
        let messages: Collection<string, Message> | undefined
        if (amount) messages = await channel?.messages.fetch({ limit: amount })
        const embedBase: EmbedBuilder = new EmbedBuilder().setColor('Random').setTimestamp()
        if (user) {
            if (messages?.size) {
                let i = 0
                const filtered: Message<boolean>[] = []
                messages.filter((message: Message) => {
                    if (message.author.id === user.id && amount && amount > i) {
                        filtered.push(message)
                        i++
                    }
                })
                filtered.forEach((message: Message) => message ? message.delete() : null)
                await interaction.reply({ embeds: [embedBase.setDescription(`Deleted ${filtered.length} messages from ${user}.`)], ephemeral: true })
            } else {
                await interaction.reply({ embeds: [embedBase.setDescription(`No messages found from ${user}.`)], ephemeral: true })
            }
        } else if (messages?.size) {
            messages.forEach((message: Message) => message ? message.delete() : null)
            await interaction.reply({ embeds: [embedBase.setDescription(`Deleted ${messages.size} messages.`)], ephemeral: true })
        } else {
            await interaction.reply({ embeds: [embedBase.setDescription('No messages found.')], ephemeral: true })
        }
    }
}
