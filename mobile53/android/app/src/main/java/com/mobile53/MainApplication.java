// ... outros imports
import net.no_mad.tts.TextToSpeechPackage;
import com.wenkesj.voice.VoicePackage;

public class MainApplication extends Application implements ReactApplication {
    // ... resto do código

    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
      packages.add(new TextToSpeechPackage());
      packages.add(new VoicePackage());
      return packages;
    }
}
