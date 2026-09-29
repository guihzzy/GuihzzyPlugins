<h1 align="center">Guihzzy Plugins</h1>

<p align="center">
  <b>Coleção de plugins personalizados para o Equicord / Vencord desenvolvidos por Guih.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Equicord-Plugin_Pack-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Equicord" />
  <img src="https://img.shields.io/badge/Author-Guih-FF4500?style=for-the-badge" alt="Author" />
  <img src="https://img.shields.io/badge/Language-TypeScript_%26_TSX-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## 📦 Plugins Inclusos

Esta pasta reúne ferramentas exclusivas focadas em utilidades de chat, voz, notificações, monitoramento e produtividade no Discord.

| Plugin | Descrição | Categoria |
| :--- | :--- | :--- |
| **MultiForward** | Permite selecionar múltiplas mensagens no chat e encaminhá-las todas de uma só vez para qualquer canal ou amigo (com barra flutuante, busca rápida de destinos e envio seguro). | `Chat` `Utility` |
| **CallTimer** | Exibe no topo da chamada o tempo decorrido em tempo real para DMs, Grupos e Canais de Voz (buscando o início exato em DMs). | `Voice` `Appearance` `Utility` |
| **QuickEdit** | Edita mensagens próprias ou abre configurações de canais (texto, voz, categorias, tópicos) com duplo clique esquerdo. | `Chat` `Shortcuts` `Utility` |
| **VoiceChannelLog** | Registra histórico detalhado de voz (entradas, saídas, microfone mutado/desmutado, fone ensurdecido, câmeras, telas, soundboard e exportação em .JSON). | `Voice` `Utility` |
| **CallKeeper** | Transfere automaticamente a chamada do celular para o PC quando a outra pessoa sair de uma DM ou Group DM, evitando que a call caia. | `Voice` `Utility` |
| **VoiceHandoff** | Conecta o PC automaticamente na call de um usuário marcado assim que você se desconecta do celular. | `Voice` `Utility` |
| **DMGroupsNotification** | Sistema avançado de notificações e alertas específicos para grupos de DM. | `Notifications` `Utility` |
| **FollowUser** | Segue e acompanha automaticamente amigos selecionados entre canais de voz. | `Voice` `Utility` |
| **ColeriaUser** | Ferramenta complementar para monitoramento e acompanhamento em chamadas. | `Voice` `Utility` |
| **FakeDeafen** | Permite controle e simulação visual de estados de áudio e mutagem. | `Voice` `Utility` |
| **MessageSearch** | Interface otimizada e recursos extras para busca rápida de mensagens em chats. | `Chat` `Utility` |

---

## 🛠️ Como Instalar e Utilizar

1. **Localização**: Certifique-se de que os plugins estejam dentro da pasta de plugins do Equicord (`src/equicordplugins/`).
2. **Build**: Compile ou execute o cliente em modo de desenvolvimento (`pnpm build` ou `pnpm dev`).
3. **Ativação**: No Discord, abra as **Configurações de Usuário** → **Plugins** e ative os plugins desejados.
4. **Configuração**: Alguns plugins possuem opções configuráveis na engrenagem de configurações ou através do menu de contexto (botão direito em mensagens, usuários ou canais).

---

## 🔒 Boas Práticas & Segurança

- **Compatibilidade**: Desenvolvidos seguindo as convenções nativas e stores do Equicord (`VoiceStateStore`, `ChannelStore`, `UserStore`, `GuildStore`, etc.).
- **Desempenho**: Ouvintes leves com limpeza adequada de eventos no ciclo de vida (`start` / `stop`).
- **Resiliência**: Tratamento de rate-limits com delays assíncronos e fallbacks inteligentes para evitar falhas de envio ou travamentos.

---

<p align="center">Feito com ❤️ por <b>Guih</b></p>
