/*
 * Equicord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Channel, Message, User } from "@vencord/discord-types";

export interface DestinationItem {
    id: string;
    name: string;
    isDM: boolean;
    isGroupDM: boolean;
    isGuild: boolean;
    guildId?: string;
    guildName?: string;
    iconUrl?: string;
    channel?: Channel;
    user?: User;
}

export type ForwardOrder = "chronological" | "selection";
