# VoiceRejoin

O **VoiceRejoin** é um plugin para Equicord/Vencord que reconecta você automaticamente a canais de voz (Servidores) e chamadas diretas (DMs / Grupos) após fechar ou reiniciar o Discord.

---

## 🚀 Funcionalidades

- 🔄 **Reconexão Automática e Confiável:** Reconecta ao canal de voz onde você estava assim que o Discord reabre, utilizando a API oficial de ações de canal (`ChannelActions.selectVoiceChannel`) com fallback seguro.
- ⏱️ **Delay Configurável:** Permite ajustar o intervalo (em segundos) antes de tentar reconectar para aguardar o cliente carregar completamente.
- ⌛ **Timeout de Expiração:** Define uma janela de tempo máxima (ex: 60 segundos) após a desconexão para tentar o rejoin; se você demorar para reabrir, ele não reconecta desnecessariamente.
- 🛡️ **Detecção de Chamada Encerrada / Canal Vazio:** Opção para impedir a reconexão se a chamada de DM tiver sido encerrada ou se o canal de voz estiver vazio (sem outros membros).
- 🔒 **Persistência de Sessão Segura:** Salva o último canal e o estado de conexão no `DataStore` do mod, evitando loops ou reconexões repetidas se você já estiver conectado a outra call.

---

## ⚙️ Configurações

- **Set Delay before rejoining voice channel:** Intervalo em segundos antes de acionar a reconexão automática.
- **Don't attempt to rejoin after this many seconds have passed since disconnecting:** Limite de tempo de tolerância para a reconexão.
- **Do not reconnect if the call has ended or the voice channel is empty or does not exist:**
  - `None`: Sempre tenta reconectar.
  - `DMs only`: Não reconecta em DMs vazias.
  - `Servers only`: Não reconecta em canais de servidor vazios.
  - `DMs and Servers`: Protege tanto DMs quanto servidores.
- **Only apply to DMs:** Restringe a reconexão exclusivamente para chamadas de mensagens diretas e grupos.

---

<p align="center">Feito com ❤️ por <b>Guih</b></p>
