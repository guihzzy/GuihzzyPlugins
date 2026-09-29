# MultiForward (Encaminhar Várias Mensagens)

Plugin para **Equicord** que permite selecionar múltiplas mensagens no chat e encaminhá-las todas de uma só vez para qualquer canal, servidor ou mensagem direta (DM/Grupo).

---

## 🚀 Como Funciona

1. **Ativação da Seleção**:
   - **Menu de Contexto**: Clique com o botão direito em qualquer mensagem e selecione **"Encaminhar Várias Mensagens..."** (ou simplesmente clique no botão nativo **"Encaminhar"**).
   - **Botão na Mensagem**: Passe o cursor sobre uma mensagem e clique no ícone de encaminhamento na barra de ações rápidas.

2. **Modo de Seleção**:
   - Ao ativar, a mensagem inicial é selecionada automaticamente.
   - Uma **barra flutuante** elegante aparece na parte inferior da tela.
   - Cada mensagem ganha um indicador com o número da ordem de encaminhamento (`#1`, `#2`, `#3`...).
   - Clique em qualquer mensagem do chat para adicioná-la ou removê-la da seleção.
   - Pressione **Escape (`Esc`)** para cancelar a qualquer momento ou **Enter** para abrir a janela de encaminhamento.

3. **Janela de Encaminhamento**:
   - Veja a prévia e a contagem das mensagens que serão encaminhadas.
   - Remova mensagens individuais se desejar (`✕`).
   - Adicione um comentário ou nota complementar opcional.
   - Pesquise facilmente amigos, grupos ou canais de servidores.
   - Selecione **um ou múltiplos destinos** simultaneamente.
   - Clique em **"Encaminhar"** e acompanhe o progresso em tempo real.

---

## ⚙️ Configurações

- **Substituir Encaminhar Padrão**: Transforma o clique em "Encaminhar" no menu de contexto em abertura do modo de seleção múltipla (segure `Shift` caso queira usar o encaminhamento nativo de apenas uma mensagem).
- **Ordem de Envio**: Escolha entre **Ordem Cronológica** (como as mensagens foram enviadas no chat original) ou **Ordem de Seleção** (na sequência em que você clicou).
- **Intervalo entre Mensagens**: Controle de delay (em ms) para garantir entrega ordenada e proteção contra limites de taxa (rate limits) do Discord.
- **Botão na Barra de Ações**: Ative ou desative o botão de atalho na barra flutuante ao passar o mouse sobre a mensagem.

---

## 🛡️ Fallback Automático

Se o Discord rejeitar o encaminhamento nativo (por exemplo, mensagens antigas ou restrições de permissão/NSFW), o plugin faz um fallback inteligente formatando as mensagens com citação e links de anexos, garantindo que nada se perca!
