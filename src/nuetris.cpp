// NOTE: CODE MUST BE < 4 KB.

char board[10*35] = {0};
char virtualBoard[10*20] = {0};
// im never ever ever ever ever using a 2d array in c++ ever again fuck that
int ppx = 0,
    ppy = 0;
int curPiece = 0;
int curRot = 0;
int holdPiece = 0;
bool held;
bool collision = false;
int collisionTicks = 0;
bool set = false;

// T O J L S Z I
// > never using a 2d array
// > uses a 3d array
// :omegalul:

char pieces[7][4][16] = 
{
  {
    {0,0,0,0,
     0,0,1,0,
     0,1,1,1,
     0,0,0,0},
     
    {0,0,0,0,
     0,0,1,0,
     0,0,1,1,
     0,0,1,0},
     
    {0,0,0,0,
     0,0,0,0,
     0,1,1,1,
     0,0,1,0},
     
    {0,0,0,0,
     0,0,1,0,
     0,1,1,0,
     0,0,1,0},
  },
  {
    {0,0,0,0,
     0,2,2,0,
     0,2,2,0,
     0,0,0,0},
     
    {0,0,0,0,
     0,2,2,0,
     0,2,2,0,
     0,0,0,0},
     
    {0,0,0,0,
     0,2,2,0,
     0,2,2,0,
     0,0,0,0},
     
    {0,0,0,0,
     0,2,2,0,
     0,2,2,0,
     0,0,0,0},
  },
  {
    {0,0,0,0,
     0,3,0,0,
     0,3,3,3,
     0,0,0,0},
     
    {0,0,0,0,
     0,0,3,3,
     0,0,3,0,
     0,0,3,0},
     
    {0,0,0,0,
     0,0,0,0,
     0,3,3,3,
     0,0,0,3},
     
    {0,0,0,0,
     0,0,3,0,
     0,0,3,0,
     0,3,3,0},
  },  
  {
    {0,0,0,0,
     0,0,0,4,
     0,4,4,4,
     0,0,0,0},
     
    {0,0,0,0,
     0,0,4,0,
     0,0,4,0,
     0,0,4,4},
     
    {0,0,0,0,
     0,0,0,0,
     0,4,4,4,
     0,4,0,0},
     
    {0,0,0,0,
     0,4,4,0,
     0,0,4,0,
     0,0,4,0},
  },
  {
    {0,0,0,0,
     0,0,5,5,
     0,5,5,0,
     0,0,0,0},
     
    {0,0,0,0,
     0,5,0,0,
     0,5,5,0,
     0,0,5,0},
     
    {0,0,0,0,
     0,0,0,0,
     0,0,5,5,
     0,5,5,0},
     
    {0,0,0,0,
     5,0,0,0,
     5,5,0,0,
     0,5,0,0},
  },
  {
    {0,0,0,0,
     0,6,6,0,
     0,0,6,6,
     0,0,0,0},
     
    {0,0,0,0,
     0,0,0,6,
     0,0,6,6,
     0,0,6,0},
     
    {0,0,0,0,
     0,0,0,0,
     0,6,6,0,
     0,0,6,6},
     
    {0,0,0,0,
     0,0,6,0,
     0,6,6,0,
     0,6,0,0},
  },
  {
    {0,0,0,0,
     7,7,7,7,
     0,0,0,0,
     0,0,0,0},
     
    {0,0,7,0,
     0,0,7,0,
     0,0,7,0,
     0,0,7,0},
     
    {0,7,0,0,
     0,7,0,0,
     0,7,0,0,
     0,7,0,0},
     
    {0,0,0,0,
     0,0,0,0,
     7,7,7,7,
     0,0,0,0},
  },
};

char SRSPos[8][4][2] = 
{
  {{-1, 0}, {-1, 1}, {0, -2}, {-1, -2}},  // 0 -> 1
  {{1, 0}, {1, -1}, {0, 2}, {1, 2}},      // 1 <- 0
  //
  {{1, 0}, {1, -1}, {0, 2}, {1, 2}},      // 1 -> 2
  {{-1, 0}, {-1, 1}, {0, -2}, {-1, -2}},  // 2 -> 1
  //
  {{1, 0}, {1, 1}, {0, -2}, {1, -2}},     // 2 -> 3
  {{-1, 0}, {-1, -1}, {0, 2}, {-1, 2}},   // 3 <- 2
  //
  {{-1, 0}, {-1, -1}, {0, 2}, {-1, 2}},   // 3 -> 0
  {{1, 0}, {1, 1}, {0, -2}, {1, -2}},     // 0 -> 3
};


/// utils ////
int clamp(int x, int min, int max)
{
  return x < min ? min : x > max ? max : x;
}

int max(int x, int max)
{
  return x > max ? max : x;
}

int min(int x, int min)
{
  return x < min ? min : x;
}



extern "C" {
void putBlock(int x, int y, char* dstBoard, bool empty = false, char color = 1)
{
    dstBoard[x + y * 10] = (empty ? 0 : color);
}

void putPiece(int x, int y, int id, char *dstBoard, int rot = 0)
{
	for(int i = 0; i < 16; i++)
	{
		if (pieces[id][rot][i] > 0)
		{
			putBlock(x+(i%4), y+i/4, dstBoard, false, pieces[id][rot][i]);
	  }
	}
}

void clearRect(int x, int y, int w, int h, char *dstBoard)
{
  for(int xx = x; xx < clamp(x+w, 0, 10); xx++)
  {
    for(int yy = y; yy < clamp(y+h, -2, 18); yy++)
    {
      putBlock(xx, yy, dstBoard, true);
    }
  }
}

char* getBoard(int id = -1)
{
	return id == -1 ? &board[0] : &virtualBoard[0];
}

int* getPPos(bool x)
{
  return x? &ppx : &ppy;
}

bool getPieceSet()
{
  return set;
}

bool collisionCheck(int x, int y)
{
  if (board[x+y*10] > 0) return true;
  return false;
}

bool pieceCheck(int x, int y, int rot)
{
  for(int i = 0; i < 16; i++)
	{
	  if(pieces[curPiece][rot][i] > 0 && 
	     (collisionCheck(x+(i%4), 1+y+(i/4)) ||
	     (x+(i%4) > 9 || x+(i%4) < 0) ||
	      y+(i/4) >= 18))
	  {
	    return true;
	    break;
	  }
	}
	return false;
}

void input(int move, int rotate)
{
  set = false;
  clearRect(ppx, ppy-1, 5, 5, virtualBoard);
  if (!pieceCheck(ppx + move, ppy-1, curRot + rotate)) 
  {
    ppx += move;
    curRot = (curRot+rotate) < 0 ? 3 : (curRot+rotate)%4;
  } else if (rotate != 0)
  {
    int SRSIndex;
    // formula implemented
    SRSIndex = rotate * 2 - (rotate > 0);
    if (SRSIndex < 0) SRSIndex = 7;

    int x = ppx + move,
        y = ppy-1; 
    
    for(int i = 0; i < 4; i++)
    {
      if (!pieceCheck(x + SRSPos[SRSIndex][i][0],
                     y + SRSPos[SRSIndex][i][1],
                     curRot + rotate))
      {
        ppx = x + SRSPos[SRSIndex][i][0];
        ppy = y + SRSPos[SRSIndex][i][1];
        curRot = (curRot+rotate) < 0 ? 3 : (curRot+rotate)%4;
        return;
      }
    }
  }

  // this looks disgusting but afaik it's the
  // only way i can clear (mostly) the entire board 
  // without an NYI memset null
  // :shrug:
  /*
  clearRect(0,0,5,10,virtualBoard);
  clearRect(5,0,3,10,virtualBoard);
  clearRect(0,10,5,10,virtualBoard);
  clearRect(5,10,3,10,virtualBoard);*/
  // left here as a solemn reminder
  
  clearRect(ppx, ppy, 5, 5, virtualBoard);
  
	putPiece(ppx, ppy, curPiece, virtualBoard, curRot);
}

void hold()
{
  if (held) return;
  
  held = true;
  int tmp = 0;
  
  tmp = curPiece;
  if (holdPiece != -1) 
    curPiece = holdPiece;
  else
  {
    set = true;
  }
  ppx = 3;
  ppy = -2;
  holdPiece = curPiece;
}

void clearLine(int sy)
{
  for(int y = sy; y > 0; y--)
  {
    for(int x = 0; x < 10; x++)
    {
      board[x+(y)*10] = board[x+(y-1)*10];
    }
  }
}

void lineCheck()
{
  bool tmp = false;
  for(int y = -1; y < 18; y++)
  {
    tmp = false;
    for(int x = 0; x < 10; x++)
    {
      if (board[x+y*10] == 0) { tmp = true;  break; };
    }
    if (tmp) continue;
    clearLine(y);
  }
}

void setPiece()
{
  set = true;
  held = false;
  clearRect(ppx, ppy, 9, 9, virtualBoard);
  putPiece(ppx, ppy, curPiece, board, curRot);
  lineCheck();
  curPiece = (curPiece+1) % 7;
  ppx = 3;
  curRot = 0;
  ppy = -2;
  collisionTicks = 0;
}


void tick(int frame, int piece)
{
  //if (piece != -1) curPiece = piece;
  set = false;
	if (pieceCheck(ppx, ppy, curRot))
	{
	  if (!collision) collision = true;
	  else 
	  {
	    if (++collisionTicks > 8)
	    {
	      setPiece();
	    }
	  }
	  return;
	}
	collisionTicks = 0;
	ppy++;
}


void hardDrop()
{
  int a = curPiece;
  while(curPiece == a) 
  {
    input(0,0);
    tick(0,-1);
  }
}

}