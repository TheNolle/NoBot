import { table } from 'table'
import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import { ExtendedClient } from '../classes/extendedClient'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import config from '../config.json'

async function loadCommand(filePath: string, client: ExtendedClient): Promise<any> {
    const commandModule = await import(filePath)
    const command = commandModule.default

    if (!command.disabled) {
        const slashCommand = new SlashCommandBuilder()
            .setName(command.data.name)
            .setDescription(command.data.description)

        command.data.options?.forEach((option: any) => {
            slashCommand.addSubcommand(option)
        })

        client.commands.set(command.data.name, command)

        return slashCommand.toJSON()
    }
}

async function loadDirectory(directory: string, client: ExtendedClient): Promise<any[]> {
    let commands: any[] = []

    const files = readdirSync(directory)

    for (const file of files) {
        const filePath = join(directory, file)

        if (statSync(filePath).isDirectory()) {
            commands = [...commands, ...(await loadDirectory(filePath, client))]
        } else if (filePath.endsWith('.ts')) {
            const command = await loadCommand(filePath, client)
            if (command) commands.push(command)
        }
    }

    return commands
}

export async function loadCommands(client: ExtendedClient): Promise<void> {
    client.commands.clear()
    const commands = await loadDirectory(join(__dirname, '../commands'), client)
    let data: string[][]
    if (commands.length) {
        data = [['Name', 'Description', 'Status'], ...commands.map(command => [command.name, command.description, command.disabled ? '❌' : '✅'])]
        console.log(table(data))
    } else {
        console.log("No command found in the commands folder")
    }

    const rest = new REST({ version: '10' }).setToken(config.bot.token)
    try {
        if (commands.length) await rest.put(Routes.applicationCommands(config.bot.application_id), { body: commands })
    } catch (error) {
        console.error('Failed to register application commands:', error)
    }
}
