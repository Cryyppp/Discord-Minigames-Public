const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Mostra tutti i comandi disponibili e spiega il funzionamento del bot"),

  async execute(interaction) {
    const commands = Array.from(interaction.client.commands.values())
      .map((cmd) => {
        const data = cmd.data;
        // tenta leggere descrizione in diversi modi
        const desc = (data && (data.description || (data.toJSON && data.toJSON().description))) || "Nessuna descrizione";
        const name = (data && (data.name || (data.toJSON && data.toJSON().name))) || "sconosciuto";
        const cooldown = cmd.cooldown ? ` • cooldown: ${Math.floor(cmd.cooldown / 1000)}s` : "";
        return { name, desc, cooldown };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const intro = [
      "**Discord Minigames — Guida rapida**",
      "",
      "• /register <username> — registrati e ricevi 100 coin iniziali",
      "• /dailybonus — ritira 100 coin (cooldown 24h)",
      "• /baltop [limit] — mostra la classifica coin",
      "",
      "I comandi owner (es. /announce, /addcoins) sono riservati al proprietario del bot.",
      "",
    ].join("\n");

    // prepara righe per la lista comandi
    const lines = commands.map(c => `/${c.name} — ${c.desc}${c.cooldown}`);

    // chunk in pagine che rispettino il limite di campo embed (1024 chars)
    const pages = [];
    let curr = "";
    for (const line of lines) {
      if ((curr + "\n" + line).length > 1000) {
        pages.push(curr);
        curr = line;
      } else {
        curr = curr ? `${curr}\n${line}` : line;
      }
    }
    if (curr) pages.push(curr);

    // crea embed(s)
    const embeds = [];
    const first = new EmbedBuilder()
      .setTitle("Help — Comandi e funzionamento")
      .setDescription(intro)
      .setColor("Blue")
      .setTimestamp();
    embeds.push(first);

    for (let i = 0; i < pages.length; i++) {
      const e = new EmbedBuilder()
        .setTitle(i === 0 ? "Elenco comandi" : `Altri comandi (pagina ${i + 1})`)
        .setDescription(pages[i])
        .setColor("Blue");
      embeds.push(e);
    }

    // invia in modo privato per evitare spam
    return interaction.reply({ embeds, ephemeral: true });
  },
};