# MultiForward (Encaminhar V&#225;rias Mensagens)

Plugin para **Equicord** que permite selecionar m&#250;ltiplas mensagens no chat e encaminh&#225;-las todas de uma s&#243; vez para qualquer canal, servidor ou mensagem direta (DM/Grupo).

---

## &#x1F680; Como Funciona

1. **Ativa&#231;&#227;o da Sele&#231;&#227;o**:
   - **Menu de Contexto**: Clique com o bot&#227;o direito em qualquer mensagem e selecione **"Encaminhar V&#225;rias Mensagens..."** (ou simplesmente clique no bot&#227;o nativo **"Encaminhar"**).
   - **Bot&#227;o na Mensagem**: Passe o cursor sobre uma mensagem e clique no &#237;cone de encaminhamento na barra de a&#231;&#245;es r&#225;pidas.

2. **Modo de Sele&#231;&#227;o**:
   - Ao ativar, a mensagem inicial &#233; selecionada automaticamente.
   - Uma **barra flutuante** elegante aparece na parte inferior da tela.
   - Cada mensagem ganha um indicador com o n&#250;mero da ordem de encaminhamento (`#1`, `#2`, `#3`...).
   - Clique em qualquer mensagem do chat para adicion&#225;-la ou remov&#234;-la da sele&#231;&#227;o &#8212; **inclusive mensagens agrupadas** (sequ&#234;ncias consecutivas do mesmo autor sem repeti&#231;&#227;o do avatar).
   - Pressione **Escape (`Esc`)** para cancelar a qualquer momento ou **Enter** para abrir a janela de encaminhamento.

3. **Janela de Encaminhamento**:
   - Veja a pr&#233;via e a contagem das mensagens que ser&#227;o encaminhadas.
   - Remova mensagens individuais se desejar (`&#x2715;`).
   - Adicione um coment&#225;rio ou nota complementar opcional.
   - Pesquise facilmente amigos, grupos ou canais de servidores.
   - Selecione **um ou m&#250;ltiplos destinos** simultaneamente.
   - Clique em **"Encaminhar"** e acompanhe o progresso em tempo real.

---

## &#x2699;&#xFE0F; Configura&#231;&#245;es

- **Substituir Encaminhar Padr&#227;o**: Transforma o clique em "Encaminhar" no menu de contexto em abertura do modo de sele&#231;&#227;o m&#250;ltipla (segure `Shift` caso queira usar o encaminhamento nativo de apenas uma mensagem).
- **Ordem de Envio**: Escolha entre **Ordem Cronol&#243;gica** (como as mensagens foram enviadas no chat original) ou **Ordem de Sele&#231;&#227;o** (na sequ&#234;ncia em que voc&#234; clicou).
- **Intervalo entre Mensagens**: Controle de delay (em ms) para garantir entrega ordenada e prote&#231;&#227;o contra limites de taxa (rate limits) do Discord.
- **Bot&#227;o na Barra de A&#231;&#245;es**: Ative ou desative o bot&#227;o de atalho na barra flutuante ao passar o mouse sobre a mensagem.

---

## &#x1F6E1;&#xFE0F; Fallback Autom&#225;tico

Se o Discord rejeitar o encaminhamento nativo (por exemplo, mensagens antigas ou restri&#231;&#245;es de permiss&#227;o/NSFW), o plugin faz um fallback inteligente formatando as mensagens com cita&#231;&#227;o e links de anexos, garantindo que nada se perca!
