package com.example.blindmusic

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Comment
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shuffle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { NoiseApp() }
    }
}

data class Song(
    val id: Int,
    val title: String,
    val blindName: String,
    val genre: String,
    val mood: String,
    val rankChange: Int,
    val totalStreams: String,
    val dailyStreams: String
)

data class MoodPlaylist(
    val title: String,
    val moods: String,
    val songs: List<Song>
)

enum class MainTab(val title: String, val icon: ImageVector) {
    Upload("올리기", Icons.Default.Add),
    Library("라이브러리", Icons.Default.Book),
    Home("홈", Icons.Default.Home),
    Chart("차트", Icons.Default.BarChart),
    MyPage("마이", Icons.Default.Person)
}

val sampleSongs = listOf(
    Song(1, "새벽의 파동", "N#트랙 91406", "R&B", "몽환적인, 부드러운", 3, "1,240,000", "48,500"),
    Song(2, "푸른 잔향", "T#폰트 87054", "Indie", "잔잔한, 따뜻한", -1, "986,000", "31,880"),
    Song(3, "Round Signal", "B#라운드 30218", "Dance", "경쾌한, 밝은", 8, "812,400", "29,100"),
    Song(4, "Night Code", "M#블라인드 11870", "Hip-hop", "강한, 어두운", 2, "640,900", "22,940"),
    Song(5, "소금빛 바다", "A#소리 44013", "Ballad", "먹먹한, 깊은", 0, "532,100", "18,450"),
    Song(6, "Orbit Run", "Z#트랙 71904", "Rock", "거친, 시원한", 5, "488,700", "16,200")
)

val quickPlaylists = listOf(
    MoodPlaylist("드라이브", "청량한, 리듬감 있는, 밤공기", sampleSongs.take(3)),
    MoodPlaylist("작업 몰입", "차분한, 반복감 있는, 낮은 온도", sampleSongs.drop(1).take(3)),
    MoodPlaylist("새벽 감성", "몽환적인, 느린, 보컬 중심", sampleSongs.shuffled().take(3))
)

val BackgroundColor = Color(0xFF0E1117)
val SurfaceColor = Color(0xFF171B24)
val SurfaceBrightColor = Color(0xFF202736)
val PrimaryColor = Color(0xFFFFC857)
val AccentColor = Color(0xFF58C4DD)
val GreenColor = Color(0xFF35D07F)
val TextColor = Color.White
val SubTextColor = Color(0xFF9BA3B4)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoiseApp() {
    var selectedTab by remember { mutableStateOf(MainTab.Home) }
    var showSplash by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        delay(1800)
        showSplash = false
    }

    MaterialTheme {
        if (showSplash) {
            SplashScreen()
        } else {
            Scaffold(
                topBar = {
                    if (selectedTab != MainTab.Home) {
                        TopAppBar(
                            title = {},
                            colors = TopAppBarDefaults.topAppBarColors(containerColor = BackgroundColor)
                        )
                    }
                },
                bottomBar = {
                    NoiseBottomNavigation(selectedTab = selectedTab, onTabSelected = { selectedTab = it })
                },
                containerColor = BackgroundColor
            ) { innerPadding ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .background(BackgroundColor)
                ) {
                    when (selectedTab) {
                        MainTab.Upload -> UploadScreen()
                        MainTab.Library -> LibraryScreen()
                        MainTab.Home -> HomeScreen()
                        MainTab.Chart -> ChartScreen()
                        MainTab.MyPage -> MyPageScreen()
                    }
                }
            }
        }
    }
}

@Composable
fun SplashScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        Image(
            painter = painterResource(id = R.drawable.noise_logo_start),
            contentDescription = "Noise Cancelling logo",
            modifier = Modifier.size(300.dp),
            contentScale = ContentScale.Fit
        )
    }
}

@Composable
fun NoiseBottomNavigation(selectedTab: MainTab, onTabSelected: (MainTab) -> Unit) {
    NavigationBar(containerColor = Color(0xFF111722)) {
        MainTab.entries.forEach { tab ->
            NavigationBarItem(
                selected = selectedTab == tab,
                onClick = { onTabSelected(tab) },
                icon = { Icon(tab.icon, contentDescription = tab.title) },
                label = { Text(tab.title, fontSize = 11.sp) }
            )
        }
    }
}

@Composable
fun HomeScreen() {
    val topListState = rememberLazyListState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(22.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(18.dp))
            NoiseLogo()
        }
        item { UserHero() }
        item {
            SectionTitle("빠른 선곡")
            LazyRow(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                items(quickPlaylists) { playlist -> QuickPlaylistCard(playlist) }
            }
        }
        item {
            SectionTitle("실시간 음악 TOP 10")
            LazyRow(
                state = topListState,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(sampleSongs + sampleSongs.take(4)) { song ->
                    val rotation = (topListState.firstVisibleItemScrollOffset / 4f) + song.id * 18f
                    RotatingTopCover(song = song, rotation = rotation)
                }
            }
            Spacer(modifier = Modifier.height(18.dp))
        }
    }
}

@Composable
fun ChartScreen() {
    var selectedMain by remember { mutableStateOf("기간별") }
    var selectedPeriod by remember { mutableStateOf("TOP100") }
    val mainFilters = listOf("기간별", "장르별", "핫트랙", "인기아티스트")
    val periods = listOf("TOP100", "일간", "주간", "월간", "년간")

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                NoiseMark()
                Text("Noise Chart", color = TextColor, fontSize = 26.sp, fontWeight = FontWeight.Bold)
                Text("기간별 장르별 핫트랙 인기아티스트", color = SubTextColor, fontSize = 12.sp)
            }
        }
        item { FilterChips(mainFilters, selectedMain) { selectedMain = it } }
        if (selectedMain == "기간별") {
            item { FilterChips(periods, selectedPeriod) { selectedPeriod = it } }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    ActionButton("전체 재생", Icons.Default.PlayArrow)
                    ActionButton("셔플 재생", Icons.Default.Shuffle)
                }
            }
        }
        items(sampleSongs) { song ->
            ChartSongRow(rank = sampleSongs.indexOf(song) + 1, song = song)
        }
    }
}

@Composable
fun MyPageScreen() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                IconButton(onClick = {}) {
                    Icon(Icons.Default.Settings, contentDescription = "설정", tint = TextColor)
                }
            }
            UserProfileBlock()
        }
        item {
            SettlementCard()
        }
        item {
            SectionTitle("내가 올린 음악 순위")
        }
        items(sampleSongs.take(4)) { song ->
            MySongRow(rank = sampleSongs.indexOf(song) + 1, song = song)
        }
    }
}

@Composable
fun LibraryScreen() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                NoiseMark()
                Text("Noise Library", color = TextColor, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            }
        }
        item { LibraryFolder("라이브러리 이름", "저장한 플레이리스트 12개") }
        item { LibraryFolder("Noise like", "좋아요 한 음악 86곡") }
        items(sampleSongs.take(3)) { song -> CompactSongRow(song) }
    }
}

@Composable
fun UploadScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Default.Add, contentDescription = null, tint = PrimaryColor, modifier = Modifier.size(72.dp))
        Text("노래 올리기", color = TextColor, fontSize = 26.sp, fontWeight = FontWeight.Bold)
        Text("새 음악을 블라인드 트랙으로 등록하는 화면입니다.", color = SubTextColor, fontSize = 14.sp)
    }
}

@Composable
fun NoiseLogo() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        NoiseMark()
        Spacer(modifier = Modifier.width(10.dp))
        Text("NOISE", color = TextColor, fontSize = 24.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
fun NoiseMark() {
    Box(
        modifier = Modifier
            .size(46.dp)
            .clip(CircleShape)
            .background(Brush.linearGradient(listOf(PrimaryColor, AccentColor))),
        contentAlignment = Alignment.Center
    ) {
        Icon(Icons.Default.PlayArrow, contentDescription = "Noise", tint = BackgroundColor)
    }
}

@Composable
fun UserHero() {
    Card(colors = CardDefaults.cardColors(containerColor = SurfaceColor), shape = RoundedCornerShape(18.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Avatar()
            Spacer(modifier = Modifier.width(14.dp))
            Column {
                Text("귀여운 엉덩이", color = TextColor, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                Text("오늘은 드라이브 무드가 잘 맞아요", color = SubTextColor, fontSize = 13.sp)
            }
        }
    }
}

@Composable
fun QuickPlaylistCard(playlist: MoodPlaylist) {
    Card(
        modifier = Modifier.width(230.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceColor),
        shape = RoundedCornerShape(18.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(playlist.title, color = TextColor, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text(playlist.moods, color = SubTextColor, fontSize = 12.sp, maxLines = 2)
            Spacer(modifier = Modifier.height(18.dp))
            Row {
                playlist.songs.forEach { song ->
                    MiniCover(song.id)
                    Spacer(modifier = Modifier.width(6.dp))
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(onClick = {}, modifier = Modifier.background(PrimaryColor, CircleShape)) {
                    Icon(Icons.Default.PlayArrow, contentDescription = "재생", tint = BackgroundColor)
                }
                IconButton(onClick = {}, modifier = Modifier.background(SurfaceBrightColor, CircleShape)) {
                    Icon(Icons.Default.Bookmark, contentDescription = "저장", tint = TextColor)
                }
            }
        }
    }
}

@Composable
fun RotatingTopCover(song: Song, rotation: Float) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(94.dp)) {
        Box(
            modifier = Modifier
                .size(84.dp)
                .rotate(rotation)
                .clip(CircleShape)
                .background(coverBrush(song.id)),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(18.dp)
                    .clip(CircleShape)
                    .background(BackgroundColor)
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(song.blindName, color = TextColor, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
fun ChartSongRow(rank: Int, song: Song) {
    SongRowFrame {
        Text("$rank", color = TextColor, fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(28.dp))
        MiniCover(song.id)
        Spacer(modifier = Modifier.width(10.dp))
        RankChange(song.rankChange)
        Spacer(modifier = Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(song.blindName, color = TextColor, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("${song.genre} · ${song.mood}", color = SubTextColor, fontSize = 12.sp, maxLines = 1)
        }
        RowActions()
    }
}

@Composable
fun MySongRow(rank: Int, song: Song) {
    SongRowFrame {
        Text("$rank", color = PrimaryColor, fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(28.dp))
        MiniCover(song.id)
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(song.title, color = TextColor, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text("${song.blindName} · total ${song.totalStreams} · today ${song.dailyStreams}", color = SubTextColor, fontSize = 11.sp, maxLines = 1)
        }
        RowActions()
    }
}

@Composable
fun CompactSongRow(song: Song) {
    SongRowFrame {
        MiniCover(song.id)
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(song.blindName, color = TextColor, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text(song.mood, color = SubTextColor, fontSize = 12.sp)
        }
        Icon(Icons.Default.PlayArrow, contentDescription = "재생", tint = PrimaryColor)
    }
}

@Composable
fun SongRowFrame(content: @Composable RowScope.() -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = SurfaceColor), shape = RoundedCornerShape(14.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            content()
        }
    }
}

@Composable
fun MiniCover(seed: Int) {
    Box(
        modifier = Modifier
            .size(48.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(coverBrush(seed)),
        contentAlignment = Alignment.Center
    ) {
        Text("?", color = TextColor, fontWeight = FontWeight.Bold, fontSize = 20.sp)
    }
}

@Composable
fun RankChange(change: Int) {
    val text = when {
        change > 0 -> "+$change"
        change < 0 -> "$change"
        else -> "-"
    }
    val color = if (change >= 0) GreenColor else Color(0xFFFF6B6B)
    Text(text, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(34.dp))
}

@Composable
fun RowActions() {
    var expanded by remember { mutableStateOf(false) }
    Row(verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = {}) {
            Icon(Icons.Default.PlayArrow, contentDescription = "재생", tint = PrimaryColor)
        }
        Box {
            IconButton(onClick = { expanded = true }) {
                Icon(Icons.Default.MoreVert, contentDescription = "메뉴", tint = TextColor)
            }
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                DropdownMenuItem(text = { Text("저장") }, leadingIcon = { Icon(Icons.Default.Save, null) }, onClick = { expanded = false })
                DropdownMenuItem(text = { Text("곡정보") }, leadingIcon = { Icon(Icons.Default.Info, null) }, onClick = { expanded = false })
                DropdownMenuItem(text = { Text("댓글") }, leadingIcon = { Icon(Icons.Default.Comment, null) }, onClick = { expanded = false })
            }
        }
    }
}

@Composable
fun FilterChips(items: List<String>, selected: String, onSelect: (String) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.horizontalScroll(rememberScrollState())) {
        items.forEach { item ->
            Button(
                onClick = { onSelect(item) },
                colors = ButtonDefaults.buttonColors(containerColor = if (item == selected) PrimaryColor else SurfaceColor),
                shape = RoundedCornerShape(50)
            ) {
                Text(item, color = if (item == selected) BackgroundColor else TextColor)
            }
        }
    }
}

@Composable
fun ActionButton(text: String, icon: ImageVector) {
    Button(
        onClick = {},
        colors = ButtonDefaults.buttonColors(containerColor = SurfaceBrightColor),
        shape = RoundedCornerShape(12.dp)
    ) {
        Icon(icon, contentDescription = text, tint = TextColor, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.width(6.dp))
        Text(text, color = TextColor)
    }
}

@Composable
fun UserProfileBlock() {
    Card(colors = CardDefaults.cardColors(containerColor = SurfaceColor), shape = RoundedCornerShape(18.dp)) {
        Row(modifier = Modifier.fillMaxWidth().padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
            Avatar()
            Spacer(modifier = Modifier.width(14.dp))
            Column {
                Text("유저 이름", color = TextColor, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                Text("블라인드 크리에이터", color = SubTextColor, fontSize = 13.sp)
            }
        }
    }
}

@Composable
fun SettlementCard() {
    Card(colors = CardDefaults.cardColors(containerColor = SurfaceColor), shape = RoundedCornerShape(18.dp)) {
        Column(modifier = Modifier.fillMaxWidth().padding(18.dp)) {
            Text("정산 가능 금액", color = SubTextColor, fontSize = 13.sp)
            Text("500,000 won", color = PrimaryColor, fontSize = 26.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Metric("토탈 스트리밍 수", "1,000,000")
                Metric("하루 스트리밍 수", "9,876")
            }
        }
    }
}

@Composable
fun Metric(label: String, value: String) {
    Column {
        Text(label, color = SubTextColor, fontSize = 12.sp)
        Text(value, color = TextColor, fontSize = 17.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun LibraryFolder(title: String, subtitle: String) {
    Card(colors = CardDefaults.cardColors(containerColor = SurfaceColor), shape = RoundedCornerShape(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth().padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Book, contentDescription = null, tint = PrimaryColor, modifier = Modifier.size(34.dp))
            Spacer(modifier = Modifier.width(14.dp))
            Column {
                Text(title, color = TextColor, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(subtitle, color = SubTextColor, fontSize = 13.sp)
            }
        }
    }
}

@Composable
fun Avatar() {
    Box(
        modifier = Modifier
            .size(58.dp)
            .clip(CircleShape)
            .background(Brush.linearGradient(listOf(AccentColor, PrimaryColor))),
        contentAlignment = Alignment.Center
    ) {
        Icon(Icons.Default.Person, contentDescription = null, tint = BackgroundColor, modifier = Modifier.size(34.dp))
    }
}

@Composable
fun SectionTitle(title: String) {
    Text(title, color = TextColor, fontSize = 21.sp, fontWeight = FontWeight.Bold)
}

fun coverBrush(seed: Int): Brush {
    val palettes = listOf(
        listOf(Color(0xFFFFC857), Color(0xFF58C4DD)),
        listOf(Color(0xFFFF6B6B), Color(0xFF7BD88F)),
        listOf(Color(0xFFB8E986), Color(0xFF4A90E2)),
        listOf(Color(0xFFFF9F1C), Color(0xFF2EC4B6))
    )
    return Brush.linearGradient(palettes[seed % palettes.size])
}
