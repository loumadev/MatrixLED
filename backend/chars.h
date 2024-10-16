#define SIZE 5
const String img = "0123456789abcdefghijklmnopqrstuvwxyz. !?:()+-*/\\_%=,\"'`#$&;<>@[]^{}|~";

const uint8_t chars[][SIZE][SIZE] = {
	{
		{0, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0}, // 0
		{1, 0, 0, 1, 0},
		{0, 1, 1, 0, 0}
	},
	{
		{0, 0, 1, 0, 0},
		{0, 1, 1, 0, 0},
		{0, 0, 1, 0, 0}, // 1
		{0, 0, 1, 0, 0},
		{0, 1, 1, 1, 0}
	},
	{
		{0, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{0, 0, 1, 0, 0}, // 2
		{0, 1, 0, 0, 0},
		{1, 1, 1, 1, 0}
	},
	{
		{1, 1, 1, 1, 0},
		{1, 0, 0, 1, 0},
		{0, 0, 1, 0, 0}, // 3
		{1, 0, 0, 1, 0},
		{0, 1, 1, 0, 0}
	},
	{
		{0, 0, 1, 1, 0},
		{0, 1, 0, 1, 0},
		{1, 0, 0, 1, 0}, // 4
		{1, 1, 1, 1, 1},
		{0, 0, 0, 1, 0}
	},
	{
		{1, 1, 1, 1, 0},
		{1, 0, 0, 0, 0},
		{1, 1, 1, 0, 0}, // 5
		{0, 0, 0, 1, 0},
		{1, 1, 1, 0, 0}
	},
	{
		{0, 1, 1, 0, 0},
		{1, 0, 0, 0, 0},
		{1, 1, 1, 0, 0}, // 6
		{1, 0, 0, 1, 0},
		{0, 1, 1, 0, 0}
	},
	{
		{1, 1, 1, 1, 0},
		{0, 0, 0, 1, 0},
		{0, 0, 1, 0, 0}, // 7
		{0, 1, 0, 0, 0},
		{0, 1, 0, 0, 0}
	},
	{
		{0, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{0, 1, 1, 0, 0}, // 8
		{1, 0, 0, 1, 0},
		{0, 1, 1, 0, 0}
	},
	{
		{0, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{0, 1, 1, 1, 0}, // 9
		{0, 0, 0, 1, 0},
		{0, 1, 1, 0, 0}
	},
	{
		{0, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{1, 1, 1, 1, 0}, // a
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0}
	},
	{
		{1, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{1, 1, 1, 0, 0}, // b
		{1, 0, 0, 1, 0},
		{1, 1, 1, 0, 0}
	},
	{
		{0, 1, 1, 1, 0},
		{1, 0, 0, 0, 0},
		{1, 0, 0, 0, 0}, // c
		{1, 0, 0, 0, 0},
		{0, 1, 1, 1, 0}
	},
	{
		{1, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0}, // d
		{1, 0, 0, 1, 0},
		{1, 1, 1, 0, 0}
	},
	{
		{1, 1, 1, 1, 0},
		{1, 0, 0, 0, 0},
		{1, 1, 1, 0, 0}, // e
		{1, 0, 0, 0, 0},
		{1, 1, 1, 1, 0}
	},
	{
		{1, 1, 1, 1, 0},
		{1, 0, 0, 0, 0},
		{1, 1, 1, 0, 0}, // f
		{1, 0, 0, 0, 0},
		{1, 0, 0, 0, 0}
	},
	{
		{1, 1, 1, 1, 0},
		{1, 0, 0, 0, 0},
		{1, 0, 1, 1, 0}, // g
		{1, 0, 0, 1, 0},
		{0, 1, 1, 1, 0}
	},
	{
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0},
		{1, 1, 1, 1, 0}, // h
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0}
	},
	{
		{0, 1, 1, 1, 0},
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0}, // i
		{0, 0, 1, 0, 0},
		{0, 1, 1, 1, 0}
	},
	{
		{1, 1, 1, 1, 0},
		{0, 0, 0, 1, 0},
		{0, 0, 0, 1, 0}, // j
		{1, 0, 0, 1, 0},
		{0, 1, 1, 0, 0}
	},
	{
		{1, 0, 0, 1, 0},
		{1, 0, 1, 0, 0},
		{1, 1, 0, 0, 0}, // k
		{1, 0, 1, 0, 0},
		{1, 0, 0, 1, 0}
	},
	{
		{1, 0, 0, 0, 0},
		{1, 0, 0, 0, 0},
		{1, 0, 0, 0, 0}, // l
		{1, 0, 0, 0, 0},
		{1, 1, 1, 1, 0}
	},
	{
		{1, 0, 0, 0, 1},
		{1, 1, 0, 1, 1},
		{1, 0, 1, 0, 1}, // m
		{1, 0, 0, 0, 1},
		{1, 0, 0, 0, 1}
	},
	{
		{1, 0, 0, 1, 0},
		{1, 1, 0, 1, 0},
		{1, 0, 1, 1, 0}, // n
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0}
	},
	{
		{0, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0}, // o
		{1, 0, 0, 1, 0},
		{0, 1, 1, 0, 0}
	},
	{
		{1, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{1, 1, 1, 0, 0}, // p
		{1, 0, 0, 0, 0},
		{1, 0, 0, 0, 0}
	},
	{
		{0, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0}, // q
		{0, 1, 1, 0, 0},
		{0, 0, 1, 1, 0}
	},
	{
		{1, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{1, 1, 1, 0, 0}, // r
		{1, 0, 1, 0, 0},
		{1, 0, 0, 1, 0}
	},
	{
		{0, 1, 1, 1, 0},
		{1, 0, 0, 0, 0},
		{0, 1, 1, 0, 0}, // s
		{0, 0, 0, 1, 0},
		{1, 1, 1, 0, 0}
	},
	{
		{0, 1, 1, 1, 0},
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0}, // t
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0}
	},
	{
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0}, // u
		{1, 0, 0, 1, 0},
		{0, 1, 1, 0, 0}
	},
	{
		{1, 0, 0, 0, 1},
		{1, 0, 0, 0, 1},
		{1, 0, 0, 0, 1}, // v
		{0, 1, 0, 1, 0},
		{0, 0, 1, 0, 0}
	},
	{
		{1, 0, 0, 0, 1},
		{1, 0, 0, 0, 1},
		{1, 0, 1, 0, 1}, // w
		{1, 1, 0, 1, 1},
		{1, 0, 0, 0, 1}
	},
	{
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0},
		{0, 1, 1, 0, 0}, // x
		{1, 0, 0, 1, 0},
		{1, 0, 0, 1, 0}
	},
	{
		{1, 0, 0, 0, 1},
		{0, 1, 0, 1, 0},
		{0, 0, 1, 0, 0}, // y
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0}
	},
	{
		{1, 1, 1, 1, 0},
		{0, 0, 1, 0, 0},
		{0, 1, 0, 0, 0}, // z
		{1, 0, 0, 0, 0},
		{1, 1, 1, 1, 0}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}, // .
		{0, 0, 0, 0, 0},
		{0, 0, 1, 0, 0}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}, // " "
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}
	},
	{
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0}, // !
		{0, 0, 0, 0, 0},
		{0, 0, 1, 0, 0}
	},
	{
		{0, 1, 1, 1, 0},
		{1, 0, 0, 0, 1},
		{0, 0, 1, 1, 0}, // ?
		{0, 0, 0, 0, 0},
		{0, 0, 1, 0, 0}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 1, 0, 0, 0},
		{0, 0, 0, 0, 0}, // :
		{0, 1, 0, 0, 0},
		{0, 0, 0, 0, 0}
	},
	{
		{0, 0, 0, 1, 0},
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0}, // (
		{0, 0, 1, 0, 0},
		{0, 0, 0, 1, 0}
	},
	{
		{0, 1, 0, 0, 0},
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0}, // )
		{0, 0, 1, 0, 0},
		{0, 1, 0, 0, 0}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 0, 1, 0, 0},
		{0, 1, 1, 1, 0}, // +
		{0, 0, 1, 0, 0},
		{0, 0, 0, 0, 0}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0},
		{0, 1, 1, 1, 0}, // -
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 1, 0, 1, 0},
		{0, 0, 1, 0, 0}, // *
		{0, 1, 0, 1, 0},
		{0, 0, 0, 0, 0}
	},
	{
		{0, 0, 0, 0, 1},
		{0, 0, 0, 1, 0},
		{0, 0, 1, 0, 0}, // /
		{0, 1, 0, 0, 0},
		{1, 0, 0, 0, 0}
	},
	{
		{1, 0, 0, 0, 0},
		{0, 1, 0, 0, 0},
		{0, 0, 1, 0, 0}, // \ 
		{0, 0, 0, 1, 0},
		{0, 0, 0, 0, 1}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}, // _
		{0, 0, 0, 0, 0},
		{1, 1, 1, 1, 1}
	},
	{
		{1, 1, 0, 0, 1},
		{1, 1, 0, 1, 0},
		{0, 0, 1, 0, 0}, // %
		{0, 1, 0, 1, 1},
		{1, 0, 0, 1, 1}
	},
	{
		{0, 0, 0, 0, 0},
		{1, 1, 1, 1, 1},
		{0, 0, 0, 0, 0}, // =
		{1, 1, 1, 1, 1},
		{0, 0, 0, 0, 0}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}, // ,
		{0, 0, 1, 0, 0},
		{0, 1, 0, 0, 0}
	},
	{
		{0, 1, 0, 1, 0},
		{0, 1, 0, 1, 0},
		{0, 0, 0, 0, 0}, // "
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}
	},
	{
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0},
		{0, 0, 0, 0, 0}, // '
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}
	},
	{
		{0, 1, 0, 0, 0},
		{0, 0, 1, 0, 0},
		{0, 0, 0, 0, 0}, // `
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}
	},
	{
		{0, 1, 0, 1, 0},
		{1, 1, 1, 1, 1},
		{0, 1, 0, 1, 0}, // #
		{1, 1, 1, 1, 1},
		{0, 1, 0, 1, 0}
	},
	{
		{0, 1, 1, 1, 1},
		{1, 0, 1, 0, 0},
		{0, 1, 1, 1, 0}, // $
		{0, 0, 1, 0, 1},
		{1, 1, 1, 1, 0}
	},
	{
		{0, 1, 1, 0, 0},
		{1, 0, 0, 1, 0},
		{0, 1, 1, 1, 1}, // &
		{1, 0, 0, 1, 0},
		{0, 1, 1, 1, 1}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 0, 1, 0, 0},
		{0, 0, 0, 0, 0}, // ;
		{0, 0, 1, 0, 0},
		{0, 1, 0, 0, 0}
	},
	{
		{0, 0, 0, 1, 0},
		{0, 0, 1, 0, 0},
		{0, 1, 0, 0, 0}, // <
		{0, 0, 1, 0, 0},
		{0, 0, 0, 1, 0}
	},
	{
		{0, 1, 0, 0, 0},
		{0, 0, 1, 0, 0},
		{0, 0, 0, 1, 0}, // >
		{0, 0, 1, 0, 0},
		{0, 1, 0, 0, 0}
	},
	{
		{0, 1, 1, 1, 0},
		{1, 0, 0, 0, 1},
		{1, 0, 1, 0, 1}, // @
		{1, 0, 0, 1, 1},
		{0, 1, 1, 0, 0}
	},
	{
		{0, 1, 1, 0, 0},
		{0, 1, 0, 0, 0},
		{0, 1, 0, 0, 0}, // [
		{0, 1, 0, 0, 0},
		{0, 1, 1, 0, 0}
	},
	{
		{0, 0, 1, 1, 0},
		{0, 0, 0, 1, 0},
		{0, 0, 0, 1, 0}, // ]
		{0, 0, 0, 1, 0},
		{0, 0, 1, 1, 0}
	},
	{
		{0, 0, 1, 0, 0},
		{0, 1, 0, 1, 0},
		{0, 0, 0, 0, 0}, // ^
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}
	},
	{
		{0, 0, 1, 1, 0},
		{0, 1, 0, 0, 0},
		{1, 1, 0, 0, 0}, // {
		{0, 1, 0, 0, 0},
		{0, 0, 1, 1, 0}
	},
	{
		{0, 1, 1, 0, 0},
		{0, 0, 0, 1, 0},
		{0, 0, 0, 1, 1}, // }
		{0, 0, 0, 1, 0},
		{0, 1, 1, 0, 0}
	},
	{
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0}, // |
		{0, 0, 1, 0, 0},
		{0, 0, 1, 0, 0}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 1, 0, 1, 0},
		{1, 0, 1, 0, 0}, // ~
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}
	}
	// {
	// 	{0, 0, 0, 0, 0},
	// 	{0, 0, 0, 0, 0},
	// 	{0, 0, 0, 0, 0}, //
	// 	{0, 0, 0, 0, 0},
	// 	{0, 0, 0, 0, 0}
	// },
};

uint8_t unknow[SIZE][SIZE] = {
	{0, 0, 0, 0, 0},
	{0, 0, 0, 0, 0},
	{0, 0, 0, 0, 0},
	{0, 1, 1, 1, 0},
	{0, 0, 1, 0, 0}
};

uint8_t animation_frames[5][SIZE][SIZE] = {
	{
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0},
		{0, 0, 1, 0, 0},
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 0}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 1, 1, 1, 0},
		{0, 1, 1, 1, 0},
		{0, 1, 1, 1, 0},
		{0, 0, 0, 0, 0}
	},
	{
		{1, 1, 1, 1, 1},
		{1, 1, 1, 1, 1},
		{1, 1, 1, 1, 1},
		{1, 1, 1, 1, 1},
		{1, 1, 1, 1, 1}
	},
	{
		{0, 0, 0, 0, 0},
		{0, 0, 0, 0, 1},
		{0, 0, 0, 1, 0},
		{1, 0, 1, 0, 0},
		{0, 1, 0, 0, 0}
	},
	{
		{0, 1, 1, 1, 1},
		{1, 0, 1, 1, 1},
		{1, 1, 0, 1, 1},
		{1, 1, 1, 0, 1},
		{1, 1, 1, 1, 0}
	}
};
