const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');

module.exports = class EnableCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'enable',
      aliases: ['en'],
      usage: 'enable <command | command type>',
      description: 'Enables the provided command or command type. All commands are enabled by default.',
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['enable ping', 'enable Fun']
    });
  }
  run(message, args) {

    if (args.length === 0  || args[0].toLowerCase() === message.client.types.OWNER.toLowerCase()) 
      return this.sendErrorMessage(message, 'Invalid argument. Please provide a valid command or command type.');
    if (args[0].toLowerCase() === message.client.types.ADMIN.toLowerCase()) 
      return this.sendErrorMessage(message, `
        Invalid argument. \`${message.client.types.ADMIN}\` commands are always enabled.
      `);

    let disabledCommands = message.client.db.settings.selectDisabledCommands.pluck().get(message.guild.id) || [];
    if (typeof(disabledCommands) === 'string') disabledCommands = disabledCommands.split(' ');
    const type = args[0].toLowerCase();
    const command = message.client.commands.get(args[0]) || message.client.aliases.get(args[0]);
    let description;

    // Handle types
    const typeListOrig = Object.values(message.client.types);
    const typeList = typeListOrig.map(t => t.toLowerCase());
    if (typeList.includes(type)) {
      
      for (const cmd of message.client.commands.values()) {
        if (cmd.type.toLowerCase() === type  && disabledCommands.includes(cmd.name)) 
          message.client.utils.removeElement(disabledCommands, cmd.name);
      }
      description = `All \`${typeListOrig[typeList.indexOf(type)]}\` type commands have been successfully **enabled**.`;

    // Handle single commands
    } else if (command  && command.type != message.client.types.OWNER) {
      if (command.type ===message.client.types.ADMIN) 
        return this.sendErrorMessage(message, `
          Invalid argument. \`${message.client.types.ADMIN}\` commands are always enabled.
        `);
      message.client.utils.removeElement(disabledCommands, command.name); // Remove from array
      description = `The \`${command.name}\` command has been successfully **enabled**.`;
    } else return this.sendErrorMessage(message, 'Invalid argument. Please provide a valid command or command type.');

    message.client.db.settings.updateDisabledCommands.run(disabledCommands.join(' '), message.guild.id);

    disabledCommands = disabledCommands.map(c => `\`${c}\``).join(' ') || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Server Settings')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(description)
      .addField('Setting', 'Disabled Commands', true)
      .addField('Current Value', disabledCommands, true)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send(embed);
  }
};
