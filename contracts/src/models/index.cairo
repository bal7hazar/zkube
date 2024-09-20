#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct Player {
    #[key]
    id: felt252,
    game_id: u32,
    name: felt252,
    points: u32,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct Game {
    #[key]
    id: u32,
    over: bool,
    score: u32,
    moves: u32,
    next_row: u32,
    next_color: u32,
    // ------------------------
    // Bonuses
    // Bonuses usable during the game (start (0, 0, 0) and will evolve)
    hammer_bonus: u8,
    wave_bonus: u8,
    totem_bonus: u8,
    // Bonuses used during the game
    hammer_used: u8,
    wave_used: u8,
    totem_used: u8,
    // ------------------------
    combo_counter: u8,
    max_combo: u8,
    blocks: felt252,
    colors: felt252,
    player_id: felt252,
    seed: felt252,
    mode: u8,
    start_time: u64,
    tournament_id: u64,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Tournament {
    #[key]
    id: u64,
    is_set: bool,
    prize: felt252,
    top1_player_id: felt252,
    top2_player_id: felt252,
    top3_player_id: felt252,
    top1_score: u32,
    top2_score: u32,
    top3_score: u32,
    top1_claimed: bool,
    top2_claimed: bool,
    top3_claimed: bool,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Credits {
    #[key]
    id: felt252, // player_id (address)
    day_id: u64,
    remaining: u8,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Settings {
    #[key]
    id: u8,
    is_set: bool,
    free_daily_credits: u8,
    daily_mode_price: felt252,
    normal_mode_price: felt252,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Chest {
    #[key]
    id: u32,
    point_target: u32,
    points: u32,
    prize: felt252,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Participation {
    #[key]
    chest_id: u32,
    #[key]
    player_id: felt252,
    is_set: bool,
    points: u32,
    claimed: bool,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Admin {
    #[key]
    id: felt252,
    is_set: bool,
}
